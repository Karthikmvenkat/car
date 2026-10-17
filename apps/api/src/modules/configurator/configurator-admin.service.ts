import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from './storage/storage.service';
import { JobQueueService } from './pipeline/job-queue.service';
import { PipelineService } from './pipeline/pipeline.service';
import { ModelDiscoveryService, MAX_MODEL_BYTES, toVehicleQuery } from './discovery/model-discovery.service';
import { checkGlbHeader } from './gltf/gltf-io';
import { applyAdminMapping, MaterialMapping } from './gltf/material-classifier';
import { buildRenderingParameters } from './colours/colour-presets';
import { sniffImage } from './security/file-sniff';
import {
  ColourInputDto, CreateConfiguratorVehicleDto, IdentityDecisionDto, ModelUploadDto,
  RenderUploadDto, UpdateConfiguratorVehicleDto, UpdateMaterialMappingsDto,
} from './dto/configurator.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

export const MAX_REFERENCE_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_RENDER_BYTES = 6 * 1024 * 1024;

export function slugify(text: string): string {
  return text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

const API_ORIGIN = (process.env.API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

interface SharedCatalogEntry {
  filename: string;
  sourceUrl: string;
  label: string;
  bodyPaintMaterials: string[];
  entries: { material: string; category: string }[];
  dimensions: { length: number; width: number; height: number };
  licence: { source: string; sourceUrl: string };
}

/** Generic CC0 base models reused per body style so every vehicle shows a 3D preview immediately.
 *  These are placeholders — replace with a licensed exact model before selling the specific car. */
const SHARED_MODEL_CATALOG: Record<string, SharedCatalogEntry> = {
  SUV: {
    filename: 'suv-cc0.glb',
    sourceUrl: 'https://poly.pizza/m/e5fbf2ee-5c9e-47d5-8ab6-80cacd463baa',
    label: 'Poly Pizza — SUV (CC0)',
    bodyPaintMaterials: ['White'],
    entries: [
      { material: 'White', category: 'BODY_PAINT' },
      { material: 'Windows', category: 'GLASS' },
      { material: 'Grey', category: 'TRIM' },
      { material: 'Black', category: 'TRIM' },
      { material: 'Headlights', category: 'LIGHTS' },
      { material: 'TailLights', category: 'LIGHTS' },
    ],
    dimensions: { length: 4.209, width: 2.111, height: 1.528 },
    licence: { source: 'Poly Pizza', sourceUrl: 'https://poly.pizza/m/e5fbf2ee-5c9e-47d5-8ab6-80cacd463baa' },
  },
  SEDAN: {
    filename: 'generic-sedan.glb',
    sourceUrl: 'https://poly.pizza/m/59a67a6c-490e-472e-bae6-5a4d2541f1c7',
    label: 'Poly Pizza — Car (CC0)',
    bodyPaintMaterials: ['Blue'],
    entries: [
      { material: 'Blue', category: 'BODY_PAINT' },
      { material: 'Windows', category: 'GLASS' },
      { material: 'Black', category: 'TRIM' },
      { material: 'Grey', category: 'TRIM' },
      { material: 'Headlights', category: 'LIGHTS' },
      { material: 'TailLights', category: 'LIGHTS' },
    ],
    dimensions: { length: 4.221, width: 1.807, height: 1.177 },
    licence: { source: 'Poly Pizza', sourceUrl: 'https://poly.pizza/m/59a67a6c-490e-472e-bae6-5a4d2541f1c7' },
  },
  COUPE: {
    filename: 'sports-car.glb',
    sourceUrl: 'https://poly.pizza/m/1mkmFkAz5v',
    label: 'Poly Pizza — Sports Car (CC0)',
    bodyPaintMaterials: ['White'],
    entries: [
      { material: 'White', category: 'BODY_PAINT' },
      { material: 'Windows', category: 'GLASS' },
      { material: 'Grey', category: 'TRIM' },
      { material: 'Headlights', category: 'LIGHTS' },
      { material: 'TailLights', category: 'LIGHTS' },
      { material: 'Black', category: 'TRIM' },
    ],
    dimensions: { length: 3.927, width: 1.872, height: 1.203 },
    licence: { source: 'Poly Pizza', sourceUrl: 'https://poly.pizza/m/1mkmFkAz5v' },
  },
};

/** Fields whose change alters vehicle identity → model match + AI prompts must be redone. */
const IDENTITY_FIELDS = ['generation', 'market', 'variant', 'bodyType'] as const;

@Injectable()
export class ConfiguratorAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly jobs: JobQueueService,
    private readonly pipeline: PipelineService,
    private readonly discovery: ModelDiscoveryService,
  ) {}

  // ── Vehicles ───────────────────────────────────────────────────────────

  async createVehicle(dto: CreateConfiguratorVehicleDto, userId?: string) {
    if (dto.photoMode && (!dto.price || dto.colours.some((c) => !c.imageUrl))) {
      throw new BadRequestException('Photo mode requires a positive price and an image for every colour.');
    }
    this.assertUniqueColourNames(dto.colours);
    const brand = await this.findOrCreateBrand(dto.make.trim());
    const model = await this.findOrCreateModel(brand.id, dto.model.trim(), dto.bodyType);
    const slug = await this.uniqueSlug(slugify(`${brand.name} ${model.name} ${dto.year} ${dto.variant}`));

    const vehicle = await this.prisma.vehicle.create({
      data: {
        slug,
        brandId: brand.id,
        modelId: model.id,
        variant: dto.variant.trim(),
        year: dto.year,
        generation: dto.generation?.trim() || null,
        market: dto.market?.trim() || null,
        condition: 'NEW',
        price: dto.price ?? 0,
        currency: dto.currency || 'INR',
        priceVerified: dto.priceVerified ?? false,
        mileage: 0,
        fuelType: dto.fuelType,
        transmission: dto.transmission,
        drivetrain: dto.drivetrain || null,
        bodyStyle: dto.bodyType,
        exteriorColor: dto.colours[0].name,
        interiorOptions: dto.interiorOptions ?? [],
        wheelOptions: dto.wheelOptions ?? [],
        interiorColor: dto.interiorOptions?.[0] ?? null,
        specifications: (dto.specifications ?? undefined) as Prisma.InputJsonValue | undefined,
        manufacturerUrl: dto.manufacturerUrl || null,
        description: dto.description || null,
        status: dto.photoMode ? 'AVAILABLE' : 'DRAFT',
        assetStatus: dto.photoMode ? 'PUBLISHED' : 'DRAFT',
        publicationStatus: dto.photoMode ? 'PUBLISHED' : 'UNPUBLISHED',
        configuratorPublishedAt: dto.photoMode ? new Date() : null,
        colours: { create: dto.colours.map((c, i) => this.colourData(c, i)) },
      },
    });
    await this.audit(userId, 'configurator.vehicle.create', vehicle.id, { slug });

    const job = dto.photoMode || dto.generateAssets === false ? null : await this.jobs.enqueue(vehicle.id, { requestedById: userId });
    if (!dto.photoMode) await this.attachSharedBaseModel(vehicle.id, dto.bodyType);
    return { vehicle: await this.getVehicle(vehicle.id), job: job?.job ?? null };
  }

  async listVehicles() {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { OR: [{ colours: { some: {} } }, { assetJobs: { some: {} } }] },
      include: {
        brand: { select: { name: true } },
        model: { select: { name: true } },
        assetJobs: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, jobStatus: true, progress: true, processingStage: true, errorMessage: true, updatedAt: true } },
        assets: {
          where: { OR: [{ assetType: 'THUMBNAIL' }, { assetType: 'MODEL_3D_WEB', label: 'active' }, { assetType: 'AI_PREVIEW', label: 'angle:front-three-quarter' }] },
          select: { assetType: true, assetUrl: true, previewUrl: true, identityVerificationStatus: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { colours: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    return vehicles.map((v) => {
      const web = v.assets.find((a) => a.assetType === 'MODEL_3D_WEB');
      const thumb = v.assets.find((a) => a.assetType === 'THUMBNAIL') || v.assets.find((a) => a.assetType === 'AI_PREVIEW');
      return {
        id: v.id, slug: v.slug, make: v.brand.name, model: v.model.name, year: v.year, variant: v.variant, market: v.market,
        assetStatus: v.assetStatus, publicationStatus: v.publicationStatus, colourCount: v._count.colours,
        identity: web?.identityVerificationStatus ?? null, thumbnailUrl: thumb?.assetUrl ?? thumb?.previewUrl ?? null,
        thumbnailIsAi: thumb?.assetType === 'AI_PREVIEW', latestJob: v.assetJobs[0] ?? null, updatedAt: v.updatedAt,
      };
    });
  }

  async getVehicle(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        brand: true,
        model: true,
        colours: { orderBy: { sortOrder: 'asc' } },
        assets: { orderBy: [{ assetType: 'asc' }, { matchConfidence: 'desc' }, { createdAt: 'desc' }] },
        assetJobs: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    const qa = await this.pipeline.buildQaReport(id);
    return { ...vehicle, providers: this.discovery.providerStatus(), aiImagesEnabled: !!process.env.OPENAI_API_KEY, qa };
  }

  /**
   * Update details. Only identity-affecting fields trigger reprocessing (from
   * SEARCH_MODEL); price/spec/description edits never regenerate assets.
   */
  async updateVehicle(id: string, dto: UpdateConfiguratorVehicleDto, userId?: string) {
    const existing = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Vehicle not found');
    const current: Record<string, unknown> = { ...existing, bodyType: existing.bodyStyle };
    const identityChanged = IDENTITY_FIELDS.filter((f) => dto[f] !== undefined && (dto[f] || null) !== (current[f] ?? null));

    await this.prisma.vehicle.update({
      where: { id },
      data: {
        generation: dto.generation, market: dto.market, variant: dto.variant, bodyStyle: dto.bodyType,
        fuelType: dto.fuelType, transmission: dto.transmission, drivetrain: dto.drivetrain,
        interiorOptions: dto.interiorOptions, wheelOptions: dto.wheelOptions, price: dto.price,
        priceVerified: dto.priceVerified, manufacturerUrl: dto.manufacturerUrl, description: dto.description,
        specifications: dto.specifications as Prisma.InputJsonValue | undefined,
      },
    });
    await this.audit(userId, 'configurator.vehicle.update', id, { fields: Object.keys(dto), identityChanged });

    let job = null;
    if (identityChanged.length) {
      // The previously verified match may no longer apply to the new generation/variant.
      await this.prisma.vehicleAsset.updateMany({
        where: { vehicleId: id, assetType: { in: ['MODEL_3D_SOURCE', 'MODEL_3D_WEB'] }, label: 'active', identityVerificationStatus: 'VERIFIED_EXACT' },
        data: { identityVerificationStatus: 'UNVERIFIED' },
      });
      job = (await this.jobs.resumeVehicle(id, 'SEARCH_MODEL', userId)).job;
    }
    return { vehicle: await this.getVehicle(id), reprocessing: identityChanged, job };
  }

  /** Replace the colour catalogue. Rendering params update instantly; colour previews are regenerated. */
  async replaceColours(id: string, colours: ColourInputDto[], userId?: string) {
    this.assertUniqueColourNames(colours);
    await this.requireVehicle(id);
    await this.prisma.$transaction([
      this.prisma.vehicleColour.deleteMany({ where: { vehicleId: id, name: { notIn: colours.map((c) => c.name) } } }),
      ...colours.map((c, i) =>
        this.prisma.vehicleColour.upsert({
          where: { vehicleId_name: { vehicleId: id, name: c.name } },
          create: { vehicleId: id, ...this.colourData(c, i) },
          update: this.colourData(c, i),
        }),
      ),
      this.prisma.vehicle.update({ where: { id }, data: { exteriorColor: colours[0].name } }),
    ]);
    await this.audit(userId, 'configurator.colours.replace', id, { count: colours.length });
    const web = await this.pipeline.activeWeb(id);
    // Colour presets affect AI colour previews and geometry renders only — not the 3D model.
    const job = web ? (await this.jobs.resumeVehicle(id, 'AI_PREVIEWS', userId)).job : null;
    return { colours: await this.prisma.vehicleColour.findMany({ where: { vehicleId: id }, orderBy: { sortOrder: 'asc' } }), job };
  }

  // ── Uploads ────────────────────────────────────────────────────────────

  async uploadModel(id: string, file: Express.Multer.File | undefined, dto: ModelUploadDto, userId?: string) {
    await this.requireVehicle(id);
    if (!file) throw new BadRequestException('A .glb file is required');
    if (file.size > MAX_MODEL_BYTES) throw new BadRequestException(`Model exceeds ${MAX_MODEL_BYTES / 1024 / 1024} MB`);
    if (!/\.glb$/i.test(file.originalname)) throw new BadRequestException('Only binary glTF (.glb) uploads are supported');
    const header = checkGlbHeader(file.buffer);
    if (!header.ok) throw new BadRequestException(header.error);

    const stored = await this.storage.put(`vehicles/${id}/models`, file.originalname, file.buffer);
    await this.discovery.supersede(id, 'MODEL_3D_SOURCE');
    const asset = await this.prisma.vehicleAsset.create({
      data: {
        vehicleId: id,
        assetType: 'MODEL_3D_SOURCE',
        label: 'active',
        assetUrl: stored.url,
        storageKey: stored.storageKey,
        sourceProvider: 'admin-upload',
        sourceUrl: dto.sourceUrl || null,
        licenceDetails: {
          label: dto.licenceLabel, url: dto.licenceUrl ?? null, attributionText: dto.attributionText ?? null,
          author: dto.author ?? null, requiresAttribution: !!dto.attributionText, uploadedByUserId: userId ?? null,
        },
        // An uploader's claim is recorded, but "exact" is only set after review.
        identityVerificationStatus: 'UNVERIFIED',
        matchConfidence: dto.claimsExactMatch === 'true' ? 1 : null,
        assetProcessingStatus: 'PENDING',
        contentHash: stored.contentHash,
        fileSizeBytes: stored.sizeBytes,
        metadata: { originalFilename: file.originalname.slice(0, 200), claimsExactMatch: dto.claimsExactMatch === 'true' },
      },
    });
    await this.prisma.vehicle.update({ where: { id }, data: { assetStatus: 'EXACT_MODEL_FOUND' } });
    await this.audit(userId, 'configurator.model.upload', id, { assetId: asset.id, sizeBytes: stored.sizeBytes });
    const { job } = await this.jobs.resumeVehicle(id, 'PREPARE_3D', userId);
    return { asset, job };
  }

  async uploadReferenceImages(id: string, files: Express.Multer.File[] | undefined, userId?: string) {
    await this.requireVehicle(id);
    if (!files?.length) throw new BadRequestException('No images uploaded');
    const existing = await this.prisma.vehicleAsset.count({ where: { vehicleId: id, assetType: 'REFERENCE_IMAGE' } });
    if (existing + files.length > 8) throw new BadRequestException('A vehicle can have at most 8 reference images');

    const created = [];
    for (const f of files) {
      if (f.size > MAX_REFERENCE_IMAGE_BYTES) throw new BadRequestException(`${f.originalname} exceeds 10 MB`);
      const kind = sniffImage(f.buffer);
      if (!kind) throw new BadRequestException(`${f.originalname} is not a JPEG, PNG or WebP image`);
      const stored = await this.storage.put(`vehicles/${id}/reference`, `reference.${kind.ext}`, f.buffer);
      created.push(
        await this.prisma.vehicleAsset.create({
          data: {
            vehicleId: id, assetType: 'REFERENCE_IMAGE', assetUrl: stored.url, previewUrl: stored.url, storageKey: stored.storageKey,
            sourceProvider: 'admin-upload', identityVerificationStatus: 'NOT_APPLICABLE', assetProcessingStatus: 'READY',
            contentHash: stored.contentHash, fileSizeBytes: stored.sizeBytes,
            metadata: { mimeType: kind.mime, originalFilename: f.originalname.slice(0, 200) },
          },
        }),
      );
    }
    await this.audit(userId, 'configurator.reference.upload', id, { count: created.length });
    return created;
  }

  /** Geometry renders captured by the admin review page from the real 3D model. */
  async uploadRender(id: string, file: Express.Multer.File | undefined, dto: RenderUploadDto) {
    if (!file) throw new BadRequestException('Render image required');
    if (file.size > MAX_RENDER_BYTES) throw new BadRequestException('Render exceeds 6 MB');
    const kind = sniffImage(file.buffer);
    if (!kind) throw new BadRequestException('Render must be JPEG, PNG or WebP');
    const web = await this.prisma.vehicleAsset.findFirst({ where: { id: dto.webAssetId, vehicleId: id, assetType: 'MODEL_3D_WEB' } });
    if (!web) throw new BadRequestException('Unknown web model');

    const assetType = dto.label === 'thumbnail' ? 'THUMBNAIL' : 'RENDER_PREVIEW';
    const old = await this.prisma.vehicleAsset.findMany({
      where: { vehicleId: id, assetType, label: dto.label, metadata: { path: ['webAssetId'], equals: web.id } },
    });
    const stored = await this.storage.put(`vehicles/${id}/renders`, `${dto.label.replace(/[:\s]+/g, '-')}.${kind.ext}`, file.buffer);
    const asset = await this.prisma.vehicleAsset.create({
      data: {
        vehicleId: id, assetType, label: dto.label, assetUrl: stored.url, previewUrl: stored.url, storageKey: stored.storageKey,
        sourceProvider: 'viewer-render', identityVerificationStatus: web.identityVerificationStatus, assetProcessingStatus: 'READY',
        isGenerated: false, contentHash: stored.contentHash, fileSizeBytes: stored.sizeBytes,
        metadata: { webAssetId: web.id, mimeType: kind.mime, renderedFrom: '3d-geometry' },
      },
    });
    for (const o of old) await this.deleteAssetRecord(o.id);
    return asset;
  }

  // ── Candidates ─────────────────────────────────────────────────────────

  async searchCandidates(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id }, include: { brand: true, model: true } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    const { results, errors } = await this.discovery.searchExternal(toVehicleQuery(vehicle), 10);
    const saved = await this.discovery.saveCandidates(id, results);
    return { candidates: saved, errors, providers: this.discovery.providerStatus() };
  }

  async importCandidate(id: string, assetId: string, licenceAcknowledged: boolean, userId?: string) {
    const asset = await this.discovery.importCandidate(id, assetId, { licenceAcknowledged, byUserId: userId });
    await this.prisma.vehicle.update({ where: { id }, data: { assetStatus: 'EXACT_MODEL_FOUND' } });
    await this.audit(userId, 'configurator.candidate.import', id, { candidateId: assetId, assetId: asset.id, licenceAcknowledged });
    const { job } = await this.jobs.resumeVehicle(id, 'PREPARE_3D', userId);
    return { asset, job };
  }

  // ── Review ─────────────────────────────────────────────────────────────

  async updateMaterialMappings(assetId: string, dto: UpdateMaterialMappingsDto, userId?: string) {
    const web = await this.prisma.vehicleAsset.findFirst({ where: { id: assetId, assetType: 'MODEL_3D_WEB' } });
    if (!web) throw new NotFoundException('Web model not found');
    const base = web.materialMappings as unknown as MaterialMapping | null;
    if (!base?.entries) throw new BadRequestException('Model has not been classified yet');
    const known = new Set(base.entries.map((e) => e.name));
    const unknown = dto.materials.filter((m) => !known.has(m.name));
    if (unknown.length) throw new BadRequestException(`Unknown material(s): ${unknown.map((u) => u.name).join(', ')}`);

    const mapping = applyAdminMapping(base, dto.materials);
    await this.prisma.vehicleAsset.update({
      where: { id: web.id },
      data: {
        materialMappings: mapping as unknown as Prisma.InputJsonValue,
        assetProcessingStatus: mapping.status === 'needs_preparation' ? 'NEEDS_PREPARATION' : 'READY',
      },
    });
    await this.audit(userId, 'configurator.materials.update', web.vehicleId, { assetId, bodyPaint: mapping.bodyPaintMaterials });
    const job = dto.resumePipeline === false || mapping.status === 'needs_preparation'
      ? null
      : (await this.jobs.resumeVehicle(web.vehicleId, 'MAP_MATERIALS', userId)).job;
    return { mapping, job };
  }

  /** Verify identity on the active source + web model (they describe the same geometry). */
  async decideIdentity(assetId: string, dto: IdentityDecisionDto, userId?: string) {
    const asset = await this.prisma.vehicleAsset.findFirst({
      where: { id: assetId, assetType: { in: ['MODEL_3D_SOURCE', 'MODEL_3D_WEB'] } },
    });
    if (!asset) throw new NotFoundException('Model asset not found');
    if (dto.status === 'APPROVED_APPROXIMATE' && !dto.note) {
      throw new BadRequestException('Explain what differs from the real vehicle when approving an approximate model');
    }
    const decision = { status: dto.status, note: dto.note ?? null, byUserId: userId ?? null, at: new Date().toISOString() };
    const targets = await this.prisma.vehicleAsset.findMany({
      where: { vehicleId: asset.vehicleId, assetType: { in: ['MODEL_3D_SOURCE', 'MODEL_3D_WEB'] }, label: 'active' },
    });
    for (const t of targets) {
      await this.prisma.vehicleAsset.update({
        where: { id: t.id },
        data: {
          identityVerificationStatus: dto.status,
          metadata: { ...((t.metadata as object) || {}), identityDecision: decision } as Prisma.InputJsonValue,
        },
      });
    }
    await this.prisma.vehicleAsset.updateMany({
      where: { vehicleId: asset.vehicleId, assetType: { in: ['RENDER_PREVIEW', 'THUMBNAIL'] } },
      data: { identityVerificationStatus: dto.status },
    });
    if (dto.status === 'REJECTED') {
      await this.prisma.vehicle.update({ where: { id: asset.vehicleId }, data: { assetStatus: 'MODEL_UNAVAILABLE' } });
    } else if (dto.status === 'VERIFIED_EXACT') {
      const v = await this.prisma.vehicle.findUniqueOrThrow({ where: { id: asset.vehicleId } });
      if (['SEARCHING_MODEL', 'MODEL_UNAVAILABLE'].includes(v.assetStatus)) {
        await this.prisma.vehicle.update({ where: { id: v.id }, data: { assetStatus: 'EXACT_MODEL_FOUND' } });
      }
    }
    await this.audit(userId, 'configurator.identity.decide', asset.vehicleId, decision);
    return this.getVehicle(asset.vehicleId);
  }

  async approve(id: string, userId?: string, note?: string) {
    const qa = await this.pipeline.buildQaReport(id);
    if (qa.blocking.length) throw new BadRequestException(`Cannot approve: ${qa.blocking.join('; ')}`);
    const web = await this.pipeline.activeWeb(id);
    await this.prisma.vehicleAsset.update({
      where: { id: web!.id },
      data: { metadata: { ...((web!.metadata as object) || {}), approval: { at: new Date().toISOString(), byUserId: userId ?? null, note: note ?? null, qa } } as Prisma.InputJsonValue },
    });
    await this.prisma.vehicle.update({ where: { id }, data: { assetStatus: 'APPROVED' } });
    await this.audit(userId, 'configurator.package.approve', id, { webAssetId: web!.id });
    return this.getVehicle(id);
  }

  async reject(id: string, userId?: string, note?: string) {
    await this.prisma.vehicle.update({ where: { id }, data: { assetStatus: 'READY_FOR_REVIEW' } });
    const web = await this.pipeline.activeWeb(id);
    if (web) {
      const meta = { ...((web.metadata as Record<string, unknown>) || {}) };
      delete meta.approval;
      await this.prisma.vehicleAsset.update({ where: { id: web.id }, data: { metadata: { ...meta, rejection: { at: new Date().toISOString(), byUserId: userId ?? null, note: note ?? null } } as Prisma.InputJsonValue } });
    }
    await this.audit(userId, 'configurator.package.reject', id, { note });
    return this.getVehicle(id);
  }

  /**
   * Publish. With an approved package the interactive 3D configurator goes
   * live; without one, only labelled AI marketing images are shown
   * (explicitly requested via marketingOnly).
   */
  async publish(id: string, marketingOnly: boolean, userId?: string) {
    const v = await this.requireVehicle(id);
    let approvedWeb = await this.findApprovedWeb(id);
    if (!approvedWeb && !marketingOnly) {
      await this.attachSharedBaseModel(id, v.bodyStyle);
      approvedWeb = await this.findApprovedWeb(id);
    }
    if (!approvedWeb && !marketingOnly) {
      throw new BadRequestException('No approved 3D package and no shared base model for this body style.');
    }
    if (!approvedWeb) {
      const ai = await this.prisma.vehicleAsset.count({ where: { vehicleId: id, assetType: 'AI_PREVIEW' } });
      if (!ai) throw new BadRequestException('Nothing to publish: no approved 3D package and no AI marketing images');
    }
    await this.prisma.vehicle.update({
      where: { id },
      data: {
        publicationStatus: 'PUBLISHED',
        configuratorPublishedAt: new Date(),
        assetStatus: approvedWeb ? 'PUBLISHED' : v.assetStatus,
        status: v.status === 'DRAFT' ? 'AVAILABLE' : v.status,
        publishedAt: v.publishedAt ?? new Date(),
      },
    });
    await this.audit(userId, 'configurator.publish', id, { mode: approvedWeb ? 'interactive-3d' : 'marketing-only' });
    return this.getVehicle(id);
  }

  async unpublish(id: string, userId?: string) {
    const v = await this.requireVehicle(id);
    await this.prisma.vehicle.update({
      where: { id },
      data: { publicationStatus: 'UNPUBLISHED', assetStatus: v.assetStatus === 'PUBLISHED' ? 'APPROVED' : v.assetStatus },
    });
    await this.audit(userId, 'configurator.unpublish', id, {});
    return this.getVehicle(id);
  }

  async findApprovedWeb(vehicleId: string) {
    const candidates = await this.prisma.vehicleAsset.findMany({
      where: {
        vehicleId,
        assetType: 'MODEL_3D_WEB',
        identityVerificationStatus: { in: ['VERIFIED_EXACT', 'APPROVED_APPROXIMATE'] },
        assetProcessingStatus: 'READY',
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    return candidates.find((a) => !!(a.metadata as any)?.approval) ?? null;
  }

  /** Attach a generic, CC0 placeholder model so a newly-added vehicle is never blank in the 3D viewer.
   *  Does nothing if an approved web model already exists. */
  private async attachSharedBaseModel(vehicleId: string, bodyStyleRaw?: string | null) {
    const approved = await this.findApprovedWeb(vehicleId);
    if (approved) return null;

    const normalized = (bodyStyleRaw || 'Sedan').toUpperCase();
    const catalog = SHARED_MODEL_CATALOG[normalized] ?? SHARED_MODEL_CATALOG['SEDAN'];
    const filePath = path.join(this.storage.rootDir, 'models', catalog.filename);
    let fileSizeBytes: number | null = null;
    try {
      const stat = await fs.stat(filePath);
      fileSizeBytes = Number(stat.size);
    } catch {
      // File missing; still create the DB record pointing at the expected URL.
    }

    const now = new Date().toISOString();
    const asset = await this.prisma.vehicleAsset.create({
      data: {
        vehicleId,
        assetType: 'MODEL_3D_WEB',
        label: 'active',
        assetUrl: `${API_ORIGIN}/uploads/models/${catalog.filename}`,
        sourceProvider: 'poly-pizza',
        sourceUrl: catalog.sourceUrl,
        identityVerificationStatus: 'APPROVED_APPROXIMATE',
        assetProcessingStatus: 'READY',
        fileSizeBytes,
        materialMappings: {
          status: 'ok',
          bodyPaintMaterials: catalog.bodyPaintMaterials,
          entries: catalog.entries,
        } as unknown as Prisma.InputJsonValue,
        validationReport: {
          orientation: { lengthAxis: 'Z', upAxis: 'Y' },
          scale: { unitGuess: 'm', scaleToMeters: 1 },
          dimensions: catalog.dimensions,
        } as unknown as Prisma.InputJsonValue,
        licenceDetails: {
          label: 'CC0 1.0 Universal (Public Domain)',
          url: 'https://creativecommons.org/publicdomain/zero/1.0/',
          requiresAttribution: false,
          source: catalog.licence.source,
          sourceUrl: catalog.licence.sourceUrl,
          note: 'Shared generic base model — approximate shape only, not the exact vehicle. Replace with a licensed exact model before selling.',
        } as unknown as Prisma.InputJsonValue,
        metadata: {
          format: 'glb',
          version: '2.0',
          source: catalog.label,
          placeholder: true,
          modelSource: 'shared-catalog',
          approval: { approvedBy: 'system-shared-catalog', approvedAt: now, note: 'Auto-approved generic base model.' },
        } as unknown as Prisma.InputJsonValue,
      },
    });

    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { assetStatus: 'APPROVED' },
    });
    return asset;
  }

  async deleteAsset(assetId: string, userId?: string) {
    const asset = await this.prisma.vehicleAsset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundException('Asset not found');
    if (asset.assetType === 'MODEL_3D_WEB' && (asset.metadata as any)?.approval) {
      const v = await this.prisma.vehicle.findUniqueOrThrow({ where: { id: asset.vehicleId } });
      if (v.publicationStatus === 'PUBLISHED') throw new BadRequestException('Unpublish the vehicle before deleting its approved model');
    }
    await this.deleteAssetRecord(assetId);
    await this.audit(userId, 'configurator.asset.delete', asset.vehicleId, { assetId, assetType: asset.assetType });
    return { deleted: true };
  }

  // ── helpers ────────────────────────────────────────────────────────────

  private async deleteAssetRecord(assetId: string) {
    const asset = await this.prisma.vehicleAsset.delete({ where: { id: assetId } });
    if (asset.storageKey) {
      const shared = await this.prisma.vehicleAsset.count({ where: { storageKey: asset.storageKey } });
      if (shared === 0) await this.storage.remove(asset.storageKey);
    }
  }

  private colourData(c: ColourInputDto, sortOrder: number) {
    const finish = c.finish || 'metallic';
    return {
      name: c.name.trim(),
      manufacturerPaintCode: c.manufacturerPaintCode?.trim() || null,
      previewHex: c.previewHex.toLowerCase(),
      finish,
      availabilityStatus: c.availabilityStatus || 'UNVERIFIED',
      renderingParameters: { ...buildRenderingParameters(c.previewHex, finish), finish, ...(c.imageUrl ? { imageUrl: c.imageUrl } : {}) } as unknown as Prisma.InputJsonValue,
      sortOrder,
    };
  }

  private assertUniqueColourNames(colours: ColourInputDto[]) {
    const names = colours.map((c) => c.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) throw new BadRequestException('Colour names must be unique');
  }

  private async requireVehicle(id: string) {
    const v = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Vehicle not found');
    return v;
  }

  private async findOrCreateBrand(name: string) {
    const slug = slugify(name);
    const found = await this.prisma.brand.findFirst({ where: { OR: [{ slug }, { name: { equals: name, mode: 'insensitive' } }] } });
    return found ?? this.prisma.brand.create({ data: { name, slug } });
  }

  private async findOrCreateModel(brandId: string, name: string, bodyStyle?: string) {
    const slug = slugify(name);
    const found = await this.prisma.model.findUnique({ where: { brandId_slug: { brandId, slug } } });
    return found ?? this.prisma.model.create({ data: { brandId, name, slug, bodyStyle } });
  }

  private async uniqueSlug(base: string) {
    let slug = base;
    for (let i = 2; await this.prisma.vehicle.findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${base}-${i}`;
    return slug;
  }

  private async audit(userId: string | undefined, action: string, entityId: string, metadata: object) {
    await this.prisma.auditLog
      .create({ data: { userId: userId ?? null, action, entity: 'Vehicle', entityId, metadata: metadata as Prisma.InputJsonValue } })
      .catch(() => undefined);
  }
}
