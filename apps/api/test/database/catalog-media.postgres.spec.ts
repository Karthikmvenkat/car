import 'reflect-metadata';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConflictException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CatalogMediaService } from '../../src/modules/catalog-media/catalog-media.service';
import { CatalogImageProcessor } from '../../src/modules/catalog-media/image-processor';
import { PrivateMediaStorage } from '../../src/modules/catalog-media/private-media-storage';
import { CatalogIntakeService } from '../../src/modules/catalog-intake/catalog-intake.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { sourceFixture, candidateFixture } from '../catalog-fixtures';
import { mediaMetadata } from '../media-fixtures';
const sharp: typeof import('sharp')['default'] = require('sharp');
const { requireTestDatabaseUrl, requireOwnedSchema } = require('../../../../scripts/lib/test-database.cjs');
const url = requireTestDatabaseUrl(process.env.CAR_TEST_DATABASE_URL); const schema = requireOwnedSchema(process.env.CAR_TEST_DATABASE_SCHEMA);
if (url.searchParams.get('schema') !== schema) throw new Error('Owned schema required');

describe('Real PostgreSQL private image invariants', () => {
  const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  const processor = new CatalogImageProcessor(); const storage = new PrivateMediaStorage();
  const service = new CatalogMediaService(db as PrismaService, processor, storage);
  const catalog = new CatalogIntakeService(db as PrismaService);
  const previousRoot = process.env.CATALOG_MEDIA_ROOT; let root: string; let bytes: Buffer;
  beforeAll(async () => {
    await db.$connect(); const base = path.resolve(__dirname, '../../../../.cache/media-database-tests'); await fs.mkdir(base, { recursive: true });
    root = await fs.mkdtemp(path.join(base, 'private-')); process.env.CATALOG_MEDIA_ROOT = root;
    bytes = await sharp({ create: { width: 160, height: 90, channels: 3, background: '#5588aa' } }).png().toBuffer();
  });
  beforeEach(async () => {
    await db.catalogMedia.deleteMany(); await db.catalogCandidate.deleteMany(); await db.catalogSource.deleteMany(); await db.auditLog.deleteMany(); await db.user.deleteMany();
    await db.user.createMany({ data: [
      { id: 'media-admin', name: 'Synthetic admin', email: 'media-admin@example.invalid', passwordHash: 'not-a-login', role: 'ADMIN' },
      { id: 'media-inventory', name: 'Synthetic inventory', email: 'media-inventory@example.invalid', passwordHash: 'not-a-login', role: 'INVENTORY_MANAGER' },
    ] });
  });
  afterEach(async () => { await db.catalogMedia.deleteMany(); });
  afterAll(async () => { if (previousRoot === undefined) delete process.env.CATALOG_MEDIA_ROOT; else process.env.CATALOG_MEDIA_ROOT = previousRoot; await db.$disconnect(); });
  async function fixture(accepted = true) {
    const source = await catalog.createSource(sourceFixture(), 'media-admin');
    const candidate = await catalog.prepare(candidateFixture(source.id), 'media-inventory');
    if (accepted) await catalog.review(candidate.id, { decision: 'ACCEPTED', note: 'Synthetic facts' }, 'media-inventory');
    const dto = mediaMetadata(source.id); return { source, candidate, dto };
  }
  it('prepares real private files with provenance and deduplicates concurrent uploads', async () => {
    const { candidate, dto } = await fixture();
    const results = await Promise.all([service.upload(candidate.id, dto, bytes, 'media-inventory'), service.upload(candidate.id, dto, bytes, 'media-inventory')]);
    expect(results[0].id).toBe(results[1].id); expect(results[0]).toMatchObject({ creator: dto.creator, status: 'READY_FOR_REVIEW', eligibleForPublication: false });
    expect(results[0]).not.toHaveProperty('storageKey');
    expect(await db.catalogMedia.count()).toBe(1); expect(await db.auditLog.count({ where: { action: 'catalog.media.prepare' } })).toBe(1);
    const image = await service.derivative(results[0].id, 'preview'); expect((await sharp(image).metadata()).format).toBe('webp');
    await expect(service.upload(candidate.id, { ...dto, alt: 'Changed content' }, bytes, 'media-inventory')).rejects.toBeInstanceOf(ConflictException);
  });
  it('requires exact identity and eligible facts for acceptance; retains current eligibility separately', async () => {
    const { candidate, dto } = await fixture(false); const media = await service.upload(candidate.id, dto, bytes, 'media-inventory');
    await expect(service.review(media.id, { decision: 'ACCEPTED', note: 'Synthetic', identityConfirmed: true }, 'media-inventory')).rejects.toBeInstanceOf(ConflictException);
    await catalog.review(candidate.id, { decision: 'ACCEPTED', note: 'Facts accepted' }, 'media-inventory');
    await expect(service.review(media.id, { decision: 'ACCEPTED', note: 'Synthetic', identityConfirmed: false }, 'media-inventory')).rejects.toBeInstanceOf(ConflictException);
    const review = { decision: 'ACCEPTED' as const, note: 'Exact synthetic variant', identityConfirmed: true };
    expect((await service.review(media.id, review, 'media-inventory')).eligibleForPublication).toBe(true);
    await service.review(media.id, review, 'media-inventory');
    expect(await db.auditLog.count({ where: { action: 'catalog.media.review' } })).toBe(1);
  });
  it('allows exactly one competing final review', async () => {
    const { candidate, dto } = await fixture(); const media = await service.upload(candidate.id, dto, bytes, 'media-inventory');
    let arrivals = 0; let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
    const racing = new CatalogMediaService({ $transaction: (operation: (tx: any) => Promise<unknown>, options: any) => db.$transaction(async tx => operation({
      ...tx, catalogMedia: new Proxy(tx.catalogMedia, { get(target, key) {
        if (key !== 'findUnique') return Reflect.get(target, key);
        return async (args: any) => { const result = await target.findUnique(args); if (arrivals < 2) { arrivals++; if (arrivals === 2) release(); await gate; } return result; };
      } }),
    }), options) } as unknown as PrismaService, processor, storage);
    const results = await Promise.allSettled([
      racing.review(media.id, { decision: 'ACCEPTED', note: 'Synthetic accepted', identityConfirmed: true }, 'media-inventory'),
      racing.review(media.id, { decision: 'REJECTED', note: 'Synthetic rejected', identityConfirmed: false }, 'media-admin'),
    ]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(await db.auditLog.count({ where: { action: 'catalog.media.review' } })).toBe(1);
  });
  it('withdraws delivery without rewriting accepted review; withdrawal is idempotent', async () => {
    const { candidate, dto } = await fixture(); const media = await service.upload(candidate.id, dto, bytes, 'media-inventory');
    await service.review(media.id, { decision: 'ACCEPTED', note: 'Synthetic', identityConfirmed: true }, 'media-inventory');
    await service.withdraw(media.id, 'media-admin'); await service.withdraw(media.id, 'media-admin');
    expect(await service.find(media.id)).toMatchObject({ status: 'ACCEPTED', eligibleForPublication: false });
    await expect(service.derivative(media.id, 'thumbnail')).rejects.toBeInstanceOf(ConflictException);
    expect(await db.auditLog.count({ where: { action: 'catalog.media.withdraw' } })).toBe(1);
  });
  it.each(['revoked','expired'])('blocks intake, acceptance and previews for %s permission', async mode => {
    const { source, candidate, dto } = await fixture(); const media = await service.upload(candidate.id, dto, bytes, 'media-inventory');
    if (mode === 'revoked') await catalog.revokeSource(source.id, 'media-admin');
    else await db.catalogSource.update({ where: { id: source.id }, data: { validUntil: new Date(0) } });
    await expect(service.upload(candidate.id, { ...dto, importKey: 'other_key_02' }, bytes, 'media-inventory')).rejects.toBeInstanceOf(ConflictException);
    await expect(service.review(media.id, { decision: 'ACCEPTED', note: 'Synthetic', identityConfirmed: true }, 'media-inventory')).rejects.toBeInstanceOf(ConflictException);
    await expect(service.derivative(media.id, 'preview')).rejects.toBeInstanceOf(ConflictException);
    expect((await service.review(media.id, { decision: 'REJECTED', note: 'Permission lapsed', identityConfirmed: false }, 'media-inventory')).status).toBe('REJECTED');
  });
  it('revalidates source and actor after binary preparation', async () => {
    const { source, candidate, dto } = await fixture();
    class RevokingStorage extends PrivateMediaStorage { async write(original: Buffer, processed: any) { const key = await super.write(original, processed); await catalog.revokeSource(source.id, 'media-admin'); return key; } }
    const revoked = new CatalogMediaService(db as PrismaService, processor, new RevokingStorage());
    await expect(revoked.upload(candidate.id, dto, bytes, 'media-inventory')).rejects.toBeInstanceOf(ConflictException);
    expect(await db.catalogMedia.count()).toBe(0);
    const second = await fixture();
    class DemotingStorage extends PrivateMediaStorage { async write(original: Buffer, processed: any) { const key = await super.write(original, processed); await db.user.update({ where: { id: 'media-inventory' }, data: { role: 'CUSTOMER' } }); return key; } }
    await expect(new CatalogMediaService(db as PrismaService, processor, new DemotingStorage()).upload(second.candidate.id, second.dto, bytes, 'media-inventory')).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('rolls back upload/review/withdrawal when audit fails but retains private completed files', async () => {
    const { candidate, dto } = await fixture(); const media = await service.upload(candidate.id, dto, bytes, 'media-inventory');
    const before = (await fs.readdir(root)).length;
    await db.$executeRawUnsafe(`CREATE FUNCTION "${schema}".reject_media_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic'; END $$`);
    await db.$executeRawUnsafe(`CREATE TRIGGER reject_media_audit BEFORE INSERT ON "${schema}"."AuditLog" FOR EACH ROW EXECUTE FUNCTION "${schema}".reject_media_audit()`);
    try {
      await expect(service.upload(candidate.id, { ...dto, importKey: 'audit_key_02' }, bytes, 'media-inventory')).rejects.toBeInstanceOf(ServiceUnavailableException);
      await expect(service.review(media.id, { decision: 'ACCEPTED', note: 'Synthetic', identityConfirmed: true }, 'media-inventory')).rejects.toBeInstanceOf(ServiceUnavailableException);
      await expect(service.withdraw(media.id, 'media-admin')).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(await db.catalogMedia.count()).toBe(1);
      expect(await service.find(media.id)).toMatchObject({ status: 'READY_FOR_REVIEW', withdrawnAt: null });
      expect((await fs.readdir(root)).length).toBeGreaterThan(before);
      expect((await service.derivative(media.id, 'preview')).length).toBeGreaterThan(0);
    } finally {
      await db.$executeRawUnsafe(`DROP TRIGGER reject_media_audit ON "${schema}"."AuditLog"`);
      await db.$executeRawUnsafe(`DROP FUNCTION "${schema}".reject_media_audit()`);
    }
  });
  it('retains committed blobs on an ambiguous commit response and recovers on retry', async () => {
    const { candidate, dto } = await fixture(); let transactions = 0;
    const uncertain = new CatalogMediaService({ $transaction: async (operation: any, options: any) => {
      const result = await db.$transaction(operation, options); transactions++;
      if (transactions === 2) throw new Error('Synthetic lost commit response'); return result;
    } } as unknown as PrismaService, processor, storage);
    await expect(uncertain.upload(candidate.id, dto, bytes, 'media-inventory')).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(await db.catalogMedia.count()).toBe(1);
    const recovered = await service.upload(candidate.id, dto, bytes, 'media-inventory');
    expect((await service.derivative(recovered.id, 'preview')).length).toBeGreaterThan(0);
    expect(await db.auditLog.count({ where: { action: 'catalog.media.prepare' } })).toBe(1);
  });
  it('does not commit media on invalid decoding or a partial filesystem write', async () => {
    const { candidate, dto } = await fixture();
    await expect(service.upload(candidate.id, dto, Buffer.from('not-an-image'), 'media-inventory')).rejects.toThrow();
    class PartialFailure extends PrivateMediaStorage {
      async write(original: Buffer, processed: any) {
        // An exclusive duplicate filename forces a real filesystem failure
        // after original+first derivative have been written privately.
        return super.write(original, { ...processed, derivatives: [processed.derivatives[0], processed.derivatives[0]] });
      }
    }
    await expect(new CatalogMediaService(db as PrismaService, processor, new PartialFailure()).upload(candidate.id, dto, bytes, 'media-inventory')).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(await db.catalogMedia.count()).toBe(0);
    expect(await db.auditLog.count({ where: { action: 'catalog.media.prepare' } })).toBe(0);
  });
  it('fails closed on tampered derivatives and never creates legacy listings', async () => {
    const initial = await db.vehicle.count(); const { candidate, dto } = await fixture();
    const media = await service.upload(candidate.id, dto, bytes, 'media-inventory');
    const record = await db.catalogMedia.findUniqueOrThrow({ where: { id: media.id } });
    await fs.writeFile(path.join(root, record.storageKey, 'preview.webp'), Buffer.from('tampered'));
    await expect(service.derivative(media.id, 'preview')).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(await db.vehicle.count()).toBe(initial);
  });
});
