const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const { requireTestDatabaseUrl, requireOwnedSchema } = require('./test-database.cjs');

async function seedE2e(env, publicRoot) {
  const url = requireTestDatabaseUrl(env.CAR_TEST_DATABASE_URL);
  if (url.searchParams.get('schema') !== requireOwnedSchema(env.CAR_TEST_DATABASE_SCHEMA)) throw new Error('Owned schema required');
  const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  try {
    const passwordHash = await bcrypt.hash('Synthetic-E2E-Only-9!', 4);
    for (const role of ['SUPER_ADMIN','ADMIN','INVENTORY_MANAGER','SALES_MANAGER','CONTENT_EDITOR','ANALYST','CUSTOMER']) {
      await db.user.create({ data: { id: `e2e-${role.toLowerCase()}`, role, name: `Fixture ${role}`, email: `${role.toLowerCase()}@e2e.invalid`, passwordHash } });
    }
    await fs.mkdir(publicRoot, { recursive: true });
    await sharp({ create: { width: 640, height: 360, channels: 3, background: '#376a94' } }).png().toFile(path.join(publicRoot, 'e2e-car.png'));
    const brand = await db.brand.create({ data: { id: 'e2e-brand', name: 'E2E Motors', slug: 'e2e-motors' } });
    for (const [i, name] of ['Aster','Boreal','Cedar','Unpublished','Reserved'].entries()) {
      const model = await db.model.create({ data: { id: `e2e-model-${i}`, brandId: brand.id, name, slug: name.toLowerCase() } });
      const published = i !== 3;
      await db.vehicle.create({ data: {
        id: `e2e-car-${i}`, slug: `e2e-${name.toLowerCase()}`, brandId: brand.id, modelId: model.id,
        variant: 'Base', year: 2026, condition: 'NEW', price: 1000000 + i * 200000, currency: 'INR', mileage: 0,
        fuelType: i === 1 ? 'Petrol' : 'Electric', transmission: 'Automatic', bodyStyle: i === 1 ? 'Hatchback' : 'SUV', exteriorColor: 'Snow White',
        status: i === 4 ? 'RESERVED' : 'AVAILABLE', publicationStatus: published ? 'PUBLISHED' : 'UNPUBLISHED',
        assetStatus: published ? 'PUBLISHED' : 'DRAFT', market: 'IN', featured: i === 0,
        description: `Synthetic ${name} for isolated E2E verification.`, specifications: { seats: 5, rangeKm: 400 },
        images: { create: { url: '/uploads/e2e-car.png', alt: `${name} synthetic front view`, isPrimary: true } },
        features: { create: [{ name: 'Synthetic parking sensor' }] },
        colours: { create: [
          { name: 'Snow White', previewHex: '#eeeeee', availabilityStatus: 'AVAILABLE', renderingParameters: { imageUrl: '/uploads/e2e-car.png' } },
          { name: 'Ocean Blue', previewHex: '#225588', availabilityStatus: 'AVAILABLE', sortOrder: 1, renderingParameters: { imageUrl: '/uploads/e2e-car.png' } },
        ] },
      } });
    }
    await db.fAQ.create({ data: { question: 'Synthetic FAQ question?', answer: 'Synthetic answer for staff records.', category: 'Fixture' } });
    await db.testimonial.create({ data: { name: 'Synthetic Reviewer', quote: 'Synthetic testimonial for testing.', rating: 5 } });
    await db.pageContent.create({ data: { slug: `e2e-run-${env.CAR_E2E_RUN_ID}`, title: env.CAR_E2E_RUN_ID, content: 'Owned synthetic E2E readiness marker' } });
  } finally { await db.$disconnect(); }
}
module.exports = { seedE2e };
