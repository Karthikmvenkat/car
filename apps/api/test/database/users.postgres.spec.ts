import 'reflect-metadata';
import { Prisma, PrismaClient } from '@prisma/client';
import { ConflictException, ForbiddenException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../src/modules/users/users.service';
import { AuthService } from '../../src/modules/auth/auth.service';
import { JwtStrategy } from '../../src/modules/auth/jwt.strategy';
import { PrismaService } from '../../src/prisma/prisma.service';

const { requireTestDatabaseUrl, requireOwnedSchema } = require('../../../../scripts/lib/test-database.cjs');
const url = requireTestDatabaseUrl(process.env.CAR_TEST_DATABASE_URL);
const schema = requireOwnedSchema(process.env.CAR_TEST_DATABASE_SCHEMA);
if (url.searchParams.get('schema') !== schema) throw new Error('Database suite requires the runner-owned schema');

describe('Real PostgreSQL account-change invariants', () => {
  const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  const service = new UsersService(db as PrismaService);

  beforeAll(async () => { await db.$connect(); });
  beforeEach(async () => {
    await db.auditLog.deleteMany();
    await db.user.deleteMany();
    await db.user.createMany({ data: [
      { id: 'admin-a', email: 'admin-a@example.invalid', name: 'Synthetic A', passwordHash: 'not-a-login-hash', role: 'SUPER_ADMIN' },
      { id: 'admin-b', email: 'admin-b@example.invalid', name: 'Synthetic B', passwordHash: 'not-a-login-hash', role: 'SUPER_ADMIN' },
      { id: 'customer', email: 'customer@example.invalid', name: 'Synthetic C', passwordHash: 'not-a-login-hash', role: 'CUSTOMER' },
    ] });
  });
  afterAll(async () => { await db.$disconnect(); });

  // The barrier aligns real reads to force overlapping serializable snapshots.
  // Every read/write/audit still uses PostgreSQL; no query results are mocked.
  function racingService() {
    let arrivals = 0;
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const synchronized = {
      $transaction: (operation: (tx: any) => Promise<unknown>, options: { isolationLevel: Prisma.TransactionIsolationLevel }) =>
        db.$transaction(async tx => operation({
          user: {
            findUnique: tx.user.findUnique.bind(tx.user),
            update: tx.user.update.bind(tx.user),
            count: async (args: any) => {
              const count = await tx.user.count(args);
              if (arrivals < 2) {
                arrivals += 1;
                if (arrivals === 2) release();
                await gate;
              }
              return count;
            },
          },
          auditLog: tx.auditLog,
        }), options),
    };
    return new UsersService(synchronized as unknown as PrismaService);
  }

  it.each(['role', 'status'])('preserves an active administrator under concurrent %s changes', async mode => {
    const racing = racingService();
    const results = await Promise.allSettled(mode === 'role'
      ? [racing.updateRole('admin-b', 'CUSTOMER', 'admin-a'), racing.updateRole('admin-a', 'CUSTOMER', 'admin-b')]
      : [racing.toggleStatus('admin-b', 'admin-a'), racing.toggleStatus('admin-a', 'admin-b')]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect(await db.user.count({ where: { role: 'SUPER_ADMIN', status: 'ACTIVE' } })).toBe(1);
    expect(await db.auditLog.count()).toBe(1);
  });

  it('rolls back a real user mutation when PostgreSQL rejects its audit insert', async () => {
    await db.$executeRawUnsafe(`CREATE FUNCTION "${schema}".reject_fixture_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic audit failure'; END $$`);
    await db.$executeRawUnsafe(`CREATE TRIGGER reject_fixture_audit BEFORE INSERT ON "${schema}"."AuditLog" FOR EACH ROW EXECUTE FUNCTION "${schema}".reject_fixture_audit()`);
    try {
      await expect(service.updateRole('admin-b', 'CUSTOMER', 'admin-a')).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect((await db.user.findUniqueOrThrow({ where: { id: 'admin-b' } })).role).toBe('SUPER_ADMIN');
      expect(await db.auditLog.count()).toBe(0);
    } finally {
      await db.$executeRawUnsafe(`DROP TRIGGER reject_fixture_audit ON "${schema}"."AuditLog"`);
      await db.$executeRawUnsafe(`DROP FUNCTION "${schema}".reject_fixture_audit()`);
    }
  });

  it('persists the successful account change and audit together', async () => {
    await service.updateRole('admin-b', 'SALES_MANAGER', 'admin-a');
    expect((await db.user.findUniqueOrThrow({ where: { id: 'admin-b' } })).role).toBe('SALES_MANAGER');
    expect(await db.auditLog.findFirst()).toMatchObject({ userId: 'admin-a', action: 'user.role.change', entityId: 'admin-b' });
  });

  it('prevents self-lockout against a real database', async () => {
    await expect(service.toggleStatus('admin-a', 'admin-a')).rejects.toBeInstanceOf(ConflictException);
    expect((await db.user.findUniqueOrThrow({ where: { id: 'admin-a' } })).status).toBe('ACTIVE');
    expect(await db.auditLog.count()).toBe(0);
  });

  it('reloads demoted roles and suspended status from PostgreSQL', async () => {
    const auth = new AuthService(db as PrismaService, new JwtService({ secret: process.env.JWT_SECRET }));
    const strategy = new JwtStrategy(auth);
    await db.user.update({ where: { id: 'admin-b' }, data: { role: 'CUSTOMER' } });
    expect(await strategy.validate({ sub: 'admin-b' })).toEqual({ sub: 'admin-b', role: 'CUSTOMER' });
    await db.user.update({ where: { id: 'admin-b' }, data: { status: 'SUSPENDED' } });
    await expect(strategy.validate({ sub: 'admin-b' })).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.updateRole('customer', 'ADMIN', 'admin-b')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
