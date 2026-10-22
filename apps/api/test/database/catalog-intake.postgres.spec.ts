import 'reflect-metadata';
import { BadRequestException, ConflictException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CatalogIntakeService } from '../../src/modules/catalog-intake/catalog-intake.service';
import { candidateFixture, sourceFixture } from '../catalog-fixtures';

const { requireTestDatabaseUrl, requireOwnedSchema } = require('../../../../scripts/lib/test-database.cjs');
const url = requireTestDatabaseUrl(process.env.CAR_TEST_DATABASE_URL);
const schema = requireOwnedSchema(process.env.CAR_TEST_DATABASE_SCHEMA);
if (url.searchParams.get('schema') !== schema) throw new Error('Database suite requires the runner-owned schema');

describe('Real PostgreSQL catalog preparation invariants', () => {
  const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  const service = new CatalogIntakeService(db as PrismaService);
  beforeAll(async () => { await db.$connect(); });
  beforeEach(async () => {
    await db.catalogCandidate.deleteMany(); await db.catalogSource.deleteMany();
    await db.auditLog.deleteMany(); await db.user.deleteMany();
    await db.user.createMany({ data: [
      { id: 'catalog-admin', email: 'catalog-admin@example.invalid', name: 'Synthetic admin', passwordHash: 'no-login', role: 'ADMIN' },
      { id: 'catalog-inventory', email: 'catalog-inventory@example.invalid', name: 'Synthetic inventory', passwordHash: 'no-login', role: 'INVENTORY_MANAGER' },
    ] });
  });
  afterAll(async () => { await db.$disconnect(); });
  const source = () => service.createSource(sourceFixture(), 'catalog-admin');

  function overlappingCandidateReads() {
    let arrivals = 0;
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    // Force overlapping real read snapshots; all queries still reach PostgreSQL.
    return new CatalogIntakeService({
      $transaction: (operation: (tx: any) => Promise<unknown>, options: any) => db.$transaction(async tx => operation({
        ...tx,
        catalogCandidate: new Proxy(tx.catalogCandidate, {
          get(target, key) {
            if (key !== 'findUnique') return Reflect.get(target, key);
            return async (args: any) => {
              const result = await target.findUnique(args);
              if (arrivals < 2) { arrivals++; if (arrivals === 2) release(); await gate; }
              return result;
            };
          },
        }),
      }), options),
    } as unknown as PrismaService);
  }

  it('requires current administrator permission and future expiry for source approval', async () => {
    await expect(service.createSource(sourceFixture(), 'catalog-inventory')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.createSource({ ...sourceFixture(), validUntil: new Date(0).toISOString() }, 'catalog-admin')).rejects.toBeInstanceOf(BadRequestException);
    const result = await source();
    expect(result).toMatchObject({ approvedById: 'catalog-admin', host: 'fixture.example.invalid', policyVersion: 1 });
    expect(await db.auditLog.count()).toBe(1);
  });
  it('deduplicates concurrent identical keyed intake with one candidate and audit', async () => {
    const approved = await source(); const input = candidateFixture(approved.id);
    const racing = overlappingCandidateReads();
    const results = await Promise.all([racing.prepare(input, 'catalog-inventory'), racing.prepare(input, 'catalog-inventory')]);
    expect(results[0].id).toBe(results[1].id);
    expect(results[0]).toMatchObject({ status: 'READY_FOR_REVIEW', eligibleForPublication: false });
    expect(results[0].facts).toEqual([expect.objectContaining({ value: 50, normalizedValue: 50, normalizedUnit: 'kWh', rawText: '50 kWh' })]);
    expect(await db.catalogCandidate.count()).toBe(1);
    expect(await db.auditLog.count({ where: { action: 'catalog.candidate.prepare' } })).toBe(1);
  });
  it('rejects conflicting reuse of a key and preserves original content', async () => {
    const approved = await source(); const input = candidateFixture(approved.id);
    await service.prepare(input, 'catalog-inventory');
    await expect(service.prepare({ ...input, identity: { ...input.identity, variant: 'Other' } }, 'catalog-inventory')).rejects.toBeInstanceOf(ConflictException);
    expect(await db.catalogCandidate.count()).toBe(1);
  });
  it('allows exactly one of two competing final review decisions', async () => {
    const approved = await source(); const candidate = await service.prepare(candidateFixture(approved.id), 'catalog-inventory');
    const racing = overlappingCandidateReads();
    const results = await Promise.allSettled([
      racing.review(candidate.id, { decision: 'ACCEPTED', note: 'Synthetic accept' }, 'catalog-inventory'),
      racing.review(candidate.id, { decision: 'REJECTED', note: 'Synthetic reject' }, 'catalog-admin'),
    ]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect(await db.auditLog.count({ where: { action: 'catalog.candidate.review' } })).toBe(1);
    const final = await service.findCandidate(candidate.id);
    expect(final.reviewedById).toBeTruthy();
    const repeat = await service.review(candidate.id, { decision: final.status as 'ACCEPTED' | 'REJECTED', note: final.reviewNote! }, 'catalog-admin');
    expect(repeat.reviewedAt).toEqual(final.reviewedAt);
    expect(await db.auditLog.count({ where: { action: 'catalog.candidate.review' } })).toBe(1);
  });
  it('revokes current eligibility without rewriting accepted history or legacy listings', async () => {
    const initialVehicles = await db.vehicle.count();
    const approved = await source(); const input = candidateFixture(approved.id);
    const candidate = await service.prepare(input, 'catalog-inventory');
    expect((await service.review(candidate.id, { decision: 'ACCEPTED', note: 'Synthetic review' }, 'catalog-inventory')).eligibleForPublication).toBe(true);
    await service.revokeSource(approved.id, 'catalog-admin');
    await service.revokeSource(approved.id, 'catalog-admin');
    expect(await service.findCandidate(candidate.id)).toMatchObject({ status: 'ACCEPTED', eligibleForPublication: false });
    await expect(service.prepare({ ...input, importKey: 'new_key_02' }, 'catalog-inventory')).rejects.toBeInstanceOf(ConflictException);
    expect(await db.auditLog.count({ where: { action: 'catalog.source.revoke' } })).toBe(1);
    expect(await db.vehicle.count()).toBe(initialVehicles);
  });
  it.each(['revoked', 'expired', 'sale-stale', 'fact-stale'])('blocks acceptance when %s but allows rejection', async mode => {
    const approved = await source(); const candidate = await service.prepare(candidateFixture(approved.id), 'catalog-inventory');
    if (mode === 'revoked') await service.revokeSource(approved.id, 'catalog-admin');
    if (mode === 'expired') await db.catalogSource.update({ where: { id: approved.id }, data: { validUntil: new Date(0) } });
    if (mode === 'sale-stale') await db.catalogCandidate.update({ where: { id: candidate.id }, data: { saleObservedAt: new Date(0) } });
    if (mode === 'fact-stale') await db.catalogCandidate.update({ where: { id: candidate.id }, data: { facts: [{ ...(candidate.facts as any[])[0], observedAt: new Date(0).toISOString() }] } });
    await expect(service.review(candidate.id, { decision: 'ACCEPTED', note: 'Synthetic' }, 'catalog-inventory')).rejects.toBeInstanceOf(ConflictException);
    expect((await service.review(candidate.id, { decision: 'REJECTED', note: 'Insufficient evidence' }, 'catalog-inventory')).status).toBe('REJECTED');
  });
  it('revalidates a demoted actor inside the mutation transaction', async () => {
    const approved = await source();
    await db.user.update({ where: { id: 'catalog-inventory' }, data: { role: 'CUSTOMER' } });
    await expect(service.prepare(candidateFixture(approved.id), 'catalog-inventory')).rejects.toBeInstanceOf(ForbiddenException);
    expect(await db.catalogCandidate.count()).toBe(0);
  });
  it('serializes acceptance against revocation, leaving no current eligibility', async () => {
    const approved = await source(); const candidate = await service.prepare(candidateFixture(approved.id), 'catalog-inventory');
    const results = await Promise.allSettled([
      service.review(candidate.id, { decision: 'ACCEPTED', note: 'Synthetic' }, 'catalog-inventory'),
      service.revokeSource(approved.id, 'catalog-admin'),
    ]);
    expect(results[1].status).toBe('fulfilled');
    expect((await service.findCandidate(candidate.id)).eligibleForPublication).toBe(false);
  });
  it('rejects stale or wrong-host intake without retaining a candidate', async () => {
    const approved = await source();
    await expect(service.prepare({ ...candidateFixture(approved.id), saleObservedAt: new Date(0).toISOString() }, 'catalog-inventory')).rejects.toBeInstanceOf(ConflictException);
    await expect(service.prepare({ ...candidateFixture(approved.id), saleEvidenceUrl: 'https://wrong.example.invalid/sale' }, 'catalog-inventory')).rejects.toBeInstanceOf(BadRequestException);
    expect(await db.catalogCandidate.count()).toBe(0);
  });
  it('rolls back prepare, review, source approval and revocation when PostgreSQL rejects audit', async () => {
    const approved = await source(); const candidate = await service.prepare(candidateFixture(approved.id), 'catalog-inventory');
    await db.$executeRawUnsafe(`CREATE FUNCTION "${schema}".reject_catalog_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic'; END $$`);
    await db.$executeRawUnsafe(`CREATE TRIGGER reject_catalog_audit BEFORE INSERT ON "${schema}"."AuditLog" FOR EACH ROW EXECUTE FUNCTION "${schema}".reject_catalog_audit()`);
    try {
      await expect(service.createSource(sourceFixture(), 'catalog-admin')).rejects.toBeInstanceOf(ServiceUnavailableException);
      await expect(service.prepare(candidateFixture(approved.id, 'other_key_02'), 'catalog-inventory')).rejects.toBeInstanceOf(ServiceUnavailableException);
      await expect(service.review(candidate.id, { decision: 'ACCEPTED', note: 'Synthetic' }, 'catalog-inventory')).rejects.toBeInstanceOf(ServiceUnavailableException);
      await expect(service.revokeSource(approved.id, 'catalog-admin')).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(await db.catalogSource.count()).toBe(1); expect(await db.catalogCandidate.count()).toBe(1);
      expect((await db.catalogSource.findUniqueOrThrow({ where: { id: approved.id } })).revokedAt).toBeNull();
      expect((await db.catalogCandidate.findUniqueOrThrow({ where: { id: candidate.id } })).status).toBe('READY_FOR_REVIEW');
      expect(await db.auditLog.count()).toBe(2);
    } finally {
      await db.$executeRawUnsafe(`DROP TRIGGER reject_catalog_audit ON "${schema}"."AuditLog"`);
      await db.$executeRawUnsafe(`DROP FUNCTION "${schema}".reject_catalog_audit()`);
    }
  });
  it('paginates private candidates without duplicate rows', async () => {
    const approved = await source();
    for (const key of ['page_key_01', 'page_key_02', 'page_key_03']) await service.prepare(candidateFixture(approved.id, key), 'catalog-inventory');
    const page1 = await service.listCandidates({ limit: 2 });
    const page2 = await service.listCandidates({ limit: 2, cursor: page1.nextCursor! });
    expect(page1.items).toHaveLength(2); expect(page2.items).toHaveLength(1); expect(page2.nextCursor).toBeNull();
    expect(new Set([...page1.items, ...page2.items].map(item => item.id)).size).toBe(3);
  });
});
