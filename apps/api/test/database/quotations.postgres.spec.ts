import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { QuotationsService } from '../../src/modules/quotations/quotations.service';
import { CreateQuotationRevisionDto } from '../../src/modules/quotations/quotations.dto';
const {
  requireTestDatabaseUrl,
  requireOwnedSchema,
} = require('../../../../scripts/lib/test-database.cjs');
const url = requireTestDatabaseUrl(process.env.CAR_TEST_DATABASE_URL);
if (
  url.searchParams.get('schema') !==
  requireOwnedSchema(process.env.CAR_TEST_DATABASE_SCHEMA)
)
  throw new Error('Owned schema required');
describe('Real PostgreSQL quotation invariants', () => {
  const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  const service = new QuotationsService(db as PrismaService);
  const input = () => ({
    requestKey: randomUUID(),
    vehicleSlug: 'quotation-fixture-car',
    phone: '9876500801',
    email: 'quote-database@example.invalid',
    consent: true,
  });
  const draft = (version = 0): CreateQuotationRevisionDto => ({
    expectedVersion: version,
    reviewed: true,
    customerName: 'Synthetic Customer',
    customerLocation: 'Fixture City',
    issuerName: 'Synthetic Automotive',
    issuerAddress: '123 Fixture Road',
    issuerContact: 'sales@example.invalid',
    validUntil: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    terms: 'Synthetic terms. Availability is confirmed separately.',
    items: [
      { label: 'Car', kind: 'CHARGE', amountPaise: 100050 },
      { label: 'Discount', kind: 'DISCOUNT', amountPaise: 25 },
    ],
  });
  beforeAll(async () => {
    await db.$connect();
  });
  beforeEach(async () => {
    await db.quotationRevision.deleteMany();
    await db.quotationRequest.deleteMany();
    await db.quotationThrottle.deleteMany();
    await db.auditLog.deleteMany();
    await db.user.upsert({
      where: { id: 'quote-sales' },
      create: {
        id: 'quote-sales',
        name: 'Synthetic Sales',
        email: 'quote-sales@example.invalid',
        passwordHash: 'no-login',
        role: 'SALES_MANAGER',
      },
      update: { role: 'SALES_MANAGER', status: 'ACTIVE' },
    });
    await db.brand.upsert({
      where: { id: 'quote-brand' },
      create: {
        id: 'quote-brand',
        name: 'Synthetic Quote Motors',
        slug: 'quote-motors',
      },
      update: {},
    });
    await db.model.upsert({
      where: { id: 'quote-model' },
      create: {
        id: 'quote-model',
        brandId: 'quote-brand',
        name: 'Fixture Car',
        slug: 'fixture',
      },
      update: {},
    });
    await db.vehicle.upsert({
      where: { slug: 'quotation-fixture-car' },
      create: {
        slug: 'quotation-fixture-car',
        brandId: 'quote-brand',
        modelId: 'quote-model',
        year: 2026,
        condition: 'NEW',
        price: 999,
        currency: 'USD',
        mileage: 0,
        fuelType: 'Petrol',
        transmission: 'Automatic',
        bodyStyle: 'SUV',
        exteriorColor: 'White',
        status: 'AVAILABLE',
        publicationStatus: 'PUBLISHED',
      },
      update: {
        year: 2026,
        status: 'AVAILABLE',
        publicationStatus: 'PUBLISHED',
      },
    });
  });
  afterAll(async () => {
    await db.$disconnect();
  });
  it('concurrent identical submissions create one snapshot and consume quota once', async () => {
    const data = input();
    const [first, second] = await Promise.all([
      service.create(data),
      service.create(data),
    ]);
    expect(first.reference).toBe(second.reference);
    expect(await db.quotationRequest.count()).toBe(1);
    expect((await db.quotationThrottle.findMany()).map((q) => q.count)).toEqual(
      [1, 1],
    );
    await db.vehicle.update({
      where: { slug: data.vehicleSlug },
      data: { publicationStatus: 'UNPUBLISHED' },
    });
    expect((await service.create(data)).reference).toBe(first.reference);
    await expect(
      service.create({ ...data, requestKey: randomUUID() }),
    ).rejects.toThrow('no longer available');
  });
  it('throttles new submissions transactionally but preserves identical retry', async () => {
    const first = input();
    await service.create(first);
    for (let i = 0; i < 4; i++) await service.create(input());
    await expect(service.create(input())).rejects.toThrow('Too many');
    expect(await db.quotationRequest.count()).toBe(5);
    expect(
      (await db.quotationThrottle.findMany()).every((q) => q.count === 5),
    ).toBe(true);
    await expect(service.create(first)).resolves.toHaveProperty('reference');
  });
  it('preserves car context and exact historical PDFs across revisions and inventory edits', async () => {
    const { reference } = await service.create(input());
    await db.vehicle.update({
      where: { slug: 'quotation-fixture-car' },
      data: { year: 2028 },
    });
    const first = await service.prepare(reference, draft(), 'quote-sales');
    const bytes = (await service.download(reference, first.revision.id)).pdf;
    expect(first.revision.totalPaise).toBe(100025);
    expect((first.revision.snapshot as any).vehicle.title).toContain('2026');
    await service.prepare(
      reference,
      { ...draft(1), customerName: 'Revised Synthetic Name' },
      'quote-sales',
    );
    expect(
      (await service.download(reference, first.revision.id)).pdf.equals(bytes),
    ).toBe(true);
    expect(await db.quotationRevision.count()).toBe(2);
    expect(
      await db.auditLog.count({ where: { action: 'QUOTATION_REVIEWED' } }),
    ).toBe(2);
  });
  it('allows only one concurrent reviewer for the expected request version', async () => {
    const { reference } = await service.create(input());
    const results = await Promise.allSettled([
      service.prepare(reference, draft(), 'quote-sales'),
      service.prepare(reference, draft(), 'quote-sales'),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    expect(await db.quotationRevision.count()).toBe(1);
    expect(
      (
        await db.quotationRequest.findUniqueOrThrow({
          where: { id: reference },
        })
      ).version,
    ).toBe(1);
  });
  it('rolls back the PDF revision and version if the audit write fails', async () => {
    const { reference } = await service.create(input());
    const failure = new QuotationsService({
      quotationRequest: db.quotationRequest,
      $transaction: (op: any, options: any) =>
        db.$transaction(
          (tx) =>
            op(
              new Proxy(tx, {
                get(target, key) {
                  if (key === 'auditLog')
                    return {
                      ...target.auditLog,
                      create: async () => {
                        throw new Error('Synthetic audit failure');
                      },
                    };
                  return Reflect.get(target, key);
                },
              }),
            ),
          options,
        ),
    } as PrismaService);
    await expect(
      failure.prepare(reference, draft(), 'quote-sales'),
    ).rejects.toThrow('Synthetic audit failure');
    expect(await db.quotationRevision.count()).toBe(0);
    expect(
      (
        await db.quotationRequest.findUniqueOrThrow({
          where: { id: reference },
        })
      ).version,
    ).toBe(0);
  });
  it('checks active current sales identity and rejects stale status updates', async () => {
    const { reference } = await service.create(input());
    await db.user.update({
      where: { id: 'quote-sales' },
      data: { role: 'CUSTOMER' },
    });
    await expect(
      service.prepare(reference, draft(), 'quote-sales'),
    ).rejects.toThrow();
    await db.user.update({
      where: { id: 'quote-sales' },
      data: { role: 'SALES_MANAGER', status: 'SUSPENDED' },
    });
    await expect(
      service.status(
        reference,
        { expectedVersion: 0, status: 'CONTACTED' },
        'quote-sales',
      ),
    ).rejects.toThrow();
    await db.user.update({
      where: { id: 'quote-sales' },
      data: { status: 'ACTIVE' },
    });
    await service.status(
      reference,
      { expectedVersion: 0, status: 'CONTACTED' },
      'quote-sales',
    );
    await expect(
      service.status(
        reference,
        { expectedVersion: 0, status: 'CLOSED' },
        'quote-sales',
      ),
    ).rejects.toThrow('Request changed');
    expect(await db.quotationRevision.count()).toBe(0);
  });
  it('refuses an out-of-band corrupted stored PDF', async () => {
    const { reference } = await service.create(input());
    const { revision } = await service.prepare(
      reference,
      draft(),
      'quote-sales',
    );
    await db.quotationRevision.update({
      where: { id: revision.id },
      data: { pdf: Buffer.from('tampered') },
    });
    await expect(service.download(reference, revision.id)).rejects.toThrow(
      'could not be verified',
    );
  });
});
