import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfiguratorAdminService } from './configurator-admin.service';
import { MaterialMapping } from './gltf/material-classifier';
import { SaveConfigurationDto } from './dto/configurator.dto';
import { AI_DISCLAIMER } from './pipeline/pipeline.service';
import { fullSizePhoto } from './images/photo-quality';

/** Public, read-only view of published vehicles. Never exposes unapproved assets. */
@Injectable()
export class ConfiguratorPublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly admin: ConfiguratorAdminService,
  ) {}

  async listPublished() {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { publicationStatus: 'PUBLISHED' },
      include: {
        brand: { select: { name: true } },
        model: { select: { name: true } },
        images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }], take: 1, select: { url: true } },
        colours: { where: { availabilityStatus: { not: 'DISCONTINUED' } }, orderBy: { sortOrder: 'asc' }, take: 1 },
        assets: {
          where: { assetType: { in: ['THUMBNAIL', 'AI_PREVIEW'] } },
          select: { assetType: true, assetUrl: true, label: true, identityVerificationStatus: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(
      vehicles.map(async (v) => {
        const web = await this.admin.findApprovedWeb(v.id);
        const thumb = v.assets.find((a) => a.assetType === 'THUMBNAIL' && web);
        const ai = v.assets.find((a) => a.assetType === 'AI_PREVIEW' && a.label === 'angle:front-three-quarter');
        const photo = (v.colours[0]?.renderingParameters as any)?.imageUrl;
        return {
          slug: v.slug, make: v.brand.name, model: v.model.name, year: v.year, variant: v.variant,
          id: v.id, price: v.price, currency: v.currency, bodyStyle: v.bodyStyle,
          fuelType: v.fuelType, transmission: v.transmission, mileage: v.mileage,
          condition: v.condition.toLowerCase(), featured: v.featured,
          createdAt: v.createdAt, updatedAt: v.updatedAt,
          has3d: !!web, imageUrl: fullSizePhoto(photo ?? thumb?.assetUrl ?? v.images[0]?.url ?? ai?.assetUrl), imageIsAiGenerated: !photo && !thumb && !v.images[0] && !!ai,
        };
      }),
    );
  }

  async getBySlug(slug: string) {
    const v = await this.prisma.vehicle.findFirst({
      where: { slug, publicationStatus: 'PUBLISHED' },
      include: {
        brand: true,
        model: true,
        images: { orderBy: { order: 'asc' }, select: { id: true, url: true, alt: true } },
        features: { select: { name: true } },
        colours: { where: { availabilityStatus: { not: 'DISCONTINUED' } }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!v) throw new NotFoundException('Vehicle not found');

    const web = await this.admin.findApprovedWeb(v.id);
    const mapping = web?.materialMappings as unknown as MaterialMapping | null;
    const renders = web
      ? await this.prisma.vehicleAsset.findMany({
          where: { vehicleId: v.id, assetType: { in: ['RENDER_PREVIEW', 'THUMBNAIL'] }, metadata: { path: ['webAssetId'], equals: web.id } },
          select: { label: true, assetUrl: true, assetType: true },
        })
      : [];
    const aiPreviews = await this.prisma.vehicleAsset.findMany({
      where: { vehicleId: v.id, assetType: 'AI_PREVIEW' },
      select: { id: true, label: true, assetUrl: true },
      orderBy: { createdAt: 'asc' },
    });
    const variants = await this.prisma.vehicle.findMany({
      where: { brandId: v.brandId, modelId: v.modelId, publicationStatus: 'PUBLISHED' },
      select: { slug: true, variant: true, year: true, fuelType: true, transmission: true, price: true, currency: true, priceVerified: true },
      orderBy: [{ year: 'desc' }, { price: 'asc' }],
    });
    const lic = (web?.licenceDetails || null) as Record<string, any> | null;
    const report = (web?.validationReport as any)?.web;

    return {
      id: v.id,
      slug: v.slug,
      make: v.brand.name,
      model: v.model.name,
      year: v.year,
      variant: v.variant,
      generation: v.generation,
      market: v.market,
      bodyType: v.bodyStyle,
      fuelType: v.fuelType,
      transmission: v.transmission,
      drivetrain: v.drivetrain,
      interiorOptions: v.interiorOptions,
      wheelOptions: v.wheelOptions,
      description: v.description,
      images: v.images.map((image) => ({ ...image, url: fullSizePhoto(image.url) })),
      features: v.features.map((feature) => feature.name),
      // Unverified prices are never presented as official.
      price: v.price > 0 ? { amount: v.price, currency: v.currency, verified: v.priceVerified, label: v.priceVerified ? 'Ex-showroom price' : 'Indicative price — confirm with dealer' } : null,
      specifications: v.specifications ?? null,
      specificationsSource: v.manufacturerUrl ? { url: v.manufacturerUrl } : null,
      model3d: web
        ? {
            url: web.assetUrl,
            sizeBytes: web.fileSizeBytes,
            identity: web.identityVerificationStatus,
            identityLabel: web.identityVerificationStatus === 'VERIFIED_EXACT' ? 'Verified 3D model' : 'Approximate 3D model — some details may differ from the production vehicle',
            bodyPaintMaterials: mapping?.bodyPaintMaterials ?? [],
            scaleToMeters: report?.scale?.unitGuess === 'cm' ? 0.01 : report?.scale?.unitGuess === 'mm' ? 0.001 : 1,
            lengthAxis: report?.orientation?.lengthAxis ?? 'Z',
            attribution: lic?.requiresAttribution
              ? { text: lic.attributionText ?? `${lic.label}`, licence: lic.label, licenceUrl: lic.url ?? null, sourceUrl: web.sourceUrl }
              : null,
          }
        : null,
      colours: v.colours.map((c) => ({
        id: c.id, name: c.name, paintCode: c.manufacturerPaintCode, hex: c.previewHex, finish: c.finish,
        verified: c.availabilityStatus === 'AVAILABLE', rendering: c.renderingParameters,
        imageUrl: fullSizePhoto((c.renderingParameters as any)?.imageUrl),
      })),
      renders: renders.map((r) => ({ label: r.label, url: r.assetUrl, type: r.assetType })),
      aiPreviews: aiPreviews.map((a) => ({ ...a, aiGenerated: true, disclaimer: AI_DISCLAIMER })),
      variants,
    };
  }

  async saveConfiguration(dto: SaveConfigurationDto, userId?: string) {
    const v = await this.prisma.vehicle.findFirst({
      where: { slug: dto.vehicleSlug, publicationStatus: 'PUBLISHED' },
      include: { colours: true },
    });
    if (!v) throw new NotFoundException('Vehicle not found');
    if (dto.selectedColour && !v.colours.some((c) => c.name === dto.selectedColour)) {
      throw new BadRequestException('Colour is not available for this vehicle');
    }
    const cfg = await this.prisma.savedConfiguration.create({
      data: {
        vehicleId: v.id,
        selectedVariant: dto.selectedVariant ?? v.variant,
        selectedColour: dto.selectedColour ?? null,
        selectedOptions: (dto.selectedOptions ?? undefined) as Prisma.InputJsonValue | undefined,
        cameraState: (dto.cameraState ?? undefined) as Prisma.InputJsonValue | undefined,
        shareToken: randomBytes(9).toString('base64url'),
        userId: userId ?? null,
      },
    });
    return { shareToken: cfg.shareToken, vehicleSlug: v.slug };
  }

  async getConfiguration(token: string) {
    const cfg = await this.prisma.savedConfiguration.findUnique({
      where: { shareToken: token },
      include: { vehicle: { select: { slug: true, publicationStatus: true } } },
    });
    if (!cfg || cfg.vehicle.publicationStatus !== 'PUBLISHED') throw new NotFoundException('Configuration not found');
    return {
      shareToken: cfg.shareToken, vehicleSlug: cfg.vehicle.slug, selectedVariant: cfg.selectedVariant,
      selectedColour: cfg.selectedColour, selectedOptions: cfg.selectedOptions, cameraState: cfg.cameraState, createdAt: cfg.createdAt,
    };
  }
}
