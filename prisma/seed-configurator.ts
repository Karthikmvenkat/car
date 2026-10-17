import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding configurator test data...\n');

  // Find an existing vehicle
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      status: 'AVAILABLE',
    },
    include: {
      brand: true,
      model: true,
    },
  });

  if (!vehicle) {
    console.error('No available vehicle found. Run main seed first.');
    return;
  }

  console.log(`Using vehicle: ${vehicle.brand.name} ${vehicle.model.name} (${vehicle.slug})`);

  // Create a sample 3D model asset (using a public GLB from Sketchfab)
  const modelAsset = await prisma.vehicleAsset.upsert({
    where: {
      id: 'test-model-3d-web',
    },
    update: {},
    create: {
      id: 'test-model-3d-web',
      vehicleId: vehicle.id,
      assetType: 'MODEL_3D_WEB',
      assetUrl: 'https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
      label: 'Optimized 3D Model',
      sourceProvider: 'admin-upload',
      identityVerificationStatus: 'VERIFIED_EXACT',
      assetProcessingStatus: 'READY',
      matchConfidence: 0.95,
      materialMappings: {
        status: 'ok',
        bodyPaintMaterials: ['Body', 'Paint'],
        entries: [
          {
            name: 'Body',
            index: 0,
            category: 'BODY_PAINT',
            confidence: 0.95,
            reason: 'Largest mesh with metallic material',
            triangleShare: 0.6,
            hasBaseColorTexture: false,
            confirmedByAdmin: true,
          },
          {
            name: 'Glass',
            index: 1,
            category: 'GLASS',
            confidence: 0.9,
            reason: 'Transparent material',
            triangleShare: 0.15,
            hasBaseColorTexture: false,
            confirmedByAdmin: true,
          },
          {
            name: 'Wheel',
            index: 2,
            category: 'WHEEL',
            confidence: 0.85,
            reason: 'Dark metallic material',
            triangleShare: 0.1,
            hasBaseColorTexture: false,
            confirmedByAdmin: true,
          },
        ],
        issues: [],
        classifiedAt: new Date().toISOString(),
        method: 'heuristic',
      },
      validationReport: {
        orientation: {
          lengthAxis: 'Z',
          upAxis: 'Y',
        },
        scale: {
          unitGuess: 'm',
          scaleToMeters: 1,
        },
        meshCount: 3,
        triangleCount: 50000,
        hasMaterials: true,
        hasTextures: false,
      },
      metadata: {
        format: 'glb',
        version: '2.0',
        approval: {
          approvedBy: 'admin@trycar.com',
          approvedAt: new Date().toISOString(),
        },
      },
      fileSizeBytes: 1024000,
      isGenerated: false,
    },
  });

  console.log(`Created 3D model asset: ${modelAsset.id}`);

  // Create sample colours with rendering parameters
  const colours = [
    {
      name: 'Alpine White',
      manufacturerPaintCode: 'A96',
      previewHex: '#F5F5F5',
      finish: 'solid',
      renderingParameters: {
        baseColor: '#F5F5F5',
        metalness: 0.1,
        roughness: 0.3,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        finish: 'solid',
      },
      availabilityStatus: 'AVAILABLE',
      sortOrder: 1,
    },
    {
      name: 'Jet Black',
      manufacturerPaintCode: '668',
      previewHex: '#0A0A0A',
      finish: 'metallic',
      renderingParameters: {
        baseColor: '#0A0A0A',
        metalness: 0.9,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        finish: 'metallic',
      },
      availabilityStatus: 'AVAILABLE',
      sortOrder: 2,
    },
    {
      name: 'Mineral Grey',
      manufacturerPaintCode: 'B39',
      previewHex: '#6B6B6B',
      finish: 'metallic',
      renderingParameters: {
        baseColor: '#6B6B6B',
        metalness: 0.85,
        roughness: 0.25,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        finish: 'metallic',
      },
      availabilityStatus: 'AVAILABLE',
      sortOrder: 3,
    },
    {
      name: 'Phytonic Blue',
      manufacturerPaintCode: 'C3Z',
      previewHex: '#1E3A5F',
      finish: 'metallic',
      renderingParameters: {
        baseColor: '#1E3A5F',
        metalness: 0.9,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        finish: 'metallic',
      },
      availabilityStatus: 'AVAILABLE',
      sortOrder: 4,
    },
    {
      name: 'Toronto Red',
      manufacturerPaintCode: 'A75',
      previewHex: '#8B0000',
      finish: 'metallic',
      renderingParameters: {
        baseColor: '#8B0000',
        metalness: 0.85,
        roughness: 0.25,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        finish: 'metallic',
      },
      availabilityStatus: 'AVAILABLE',
      sortOrder: 5,
    },
  ];

  for (const colour of colours) {
    await prisma.vehicleColour.upsert({
      where: {
        id: `test-colour-${colour.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {},
      create: {
        id: `test-colour-${colour.name.toLowerCase().replace(/\s+/g, '-')}`,
        vehicleId: vehicle.id,
        ...colour,
      },
    });
    console.log(`Created colour: ${colour.name}`);
  }

  // Update vehicle status
  await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: {
      assetStatus: 'PUBLISHED',
      publicationStatus: 'PUBLISHED',
      configuratorPublishedAt: new Date(),
    },
  });

  console.log(`\nUpdated vehicle status to PUBLISHED`);
  console.log(`\nTest data ready!`);
  console.log(`Configurator URL: http://localhost:3000/configurator?slug=${vehicle.slug}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
