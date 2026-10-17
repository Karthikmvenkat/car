import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, VehicleAsset } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { toGlb } from '../gltf/model-import';
import { AUTO_IMPORT_MIN_CONFIDENCE, scoreCandidate } from './match-scoring';
import { LicenceInfo, ModelCandidate, ModelSourceProvider, VehicleQuery } from './model-source';
import { SketchfabProvider } from './sketchfab.provider';

export const MAX_MODEL_BYTES = Number(process.env.MAX_MODEL_UPLOAD_MB || 100) * 1024 * 1024;

export interface ScoredCandidate {
  candidate: ModelCandidate;
  score: number;
  reasons: string[];
}

type VehicleForQuery = {
  id: string;
  year: number;
  variant: string | null;
  generation: string | null;
  market: string | null;
  bodyStyle: string;
  brand: { name: string };
  model: { name: string };
};

export function toVehicleQuery(v: VehicleForQuery): VehicleQuery {
  return {
    make: v.brand.name,
    model: v.model.name,
    year: v.year,
    variant: v.variant,
    generation: v.generation,
    market: v.market,
    bodyStyle: v.bodyStyle,
  };
}

/**
 * Resolves a 3D model for a vehicle: internal verified catalogue first, then
 * licensed external providers. It ranks and records candidates; it never
 * silently swaps in a different vehicle — anything not imported stays a
 * MODEL_CANDIDATE for the admin to review.
 */
@Injectable()
export class ModelDiscoveryService {
  private readonly logger = new Logger(ModelDiscoveryService.name);
  private readonly providers: ModelSourceProvider[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    sketchfab: SketchfabProvider,
  ) {
    this.providers = [sketchfab];
  }

  providerStatus() {
    return this.providers.map((p) => ({ id: p.id, searchEnabled: p.isConfigured(), downloadEnabled: p.canDownload() }));
  }

  /** The currently active source model for a vehicle, if any. */
  activeSource(vehicleId: string) {
    return this.prisma.vehicleAsset.findFirst({
      where: { vehicleId, assetType: 'MODEL_3D_SOURCE', label: 'active', identityVerificationStatus: { not: 'REJECTED' } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** A verified-exact model already prepared for the same make/model/year/generation. */
  async findInternalExact(vehicle: VehicleForQuery & { brandId: string; modelId: string }) {
    return this.prisma.vehicleAsset.findFirst({
      where: {
        assetType: 'MODEL_3D_SOURCE',
        identityVerificationStatus: 'VERIFIED_EXACT',
        assetProcessingStatus: { not: 'FAILED' },
        vehicleId: { not: vehicle.id },
        vehicle: {
          brandId: vehicle.brandId,
          modelId: vehicle.modelId,
          year: vehicle.year,
          ...(vehicle.generation ? { generation: vehicle.generation } : {}),
        },
      },
      include: { vehicle: { select: { id: true, variant: true, generation: true, market: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Reuse an internal verified asset (same file, no re-download). */
  async reuseInternal(vehicleId: string, source: VehicleAsset & { vehicle: { id: string; variant: string | null; generation: string | null; market: string | null } }, sameVariant: boolean) {
    await this.supersede(vehicleId, 'MODEL_3D_SOURCE');
    return this.prisma.vehicleAsset.create({
      data: {
        vehicleId,
        assetType: 'MODEL_3D_SOURCE',
        label: 'active',
        assetUrl: source.assetUrl,
        storageKey: source.storageKey,
        sourceProvider: 'internal-catalogue',
        sourceUrl: source.sourceUrl,
        externalId: source.externalId,
        licenceDetails: source.licenceDetails ?? Prisma.JsonNull,
        // Same make/model/year/generation was verified; a different variant may differ in wheels/trim.
        identityVerificationStatus: sameVariant ? 'VERIFIED_EXACT' : 'UNVERIFIED',
        assetProcessingStatus: 'READY',
        matchConfidence: sameVariant ? 1 : 0.9,
        contentHash: source.contentHash,
        fileSizeBytes: source.fileSizeBytes,
        metadata: { reusedFromAssetId: source.id, reusedFromVehicleId: source.vehicle.id, originalProvider: source.sourceProvider },
      },
    });
  }

  async searchExternal(query: VehicleQuery, limit = 8): Promise<{ results: ScoredCandidate[]; errors: string[] }> {
    const results: ScoredCandidate[] = [];
    const errors: string[] = [];
    for (const provider of this.providers.filter((p) => p.isConfigured())) {
      try {
        const found = await provider.search(query, limit);
        for (const candidate of found) {
          const match = scoreCandidate(query, candidate);
          if (match.modelNameMissing || match.score < 0.3) continue;
          results.push({ candidate, score: match.score, reasons: match.reasons });
        }
      } catch (err) {
        errors.push(`${provider.id}: ${(err as Error).message}`);
        if ((err as Error).name === 'TransientError' && results.length === 0) throw err;
      }
    }
    results.sort((a, b) => b.score - a.score);
    return { results: results.slice(0, limit), errors };
  }

  /** Persist candidates (upsert by provider + external id). Returns stored assets in score order. */
  async saveCandidates(vehicleId: string, scored: ScoredCandidate[]) {
    const saved: VehicleAsset[] = [];
    for (const { candidate: c, score, reasons } of scored) {
      const data = {
        assetType: 'MODEL_CANDIDATE' as const,
        label: c.name.slice(0, 120),
        previewUrl: c.thumbnailUrl,
        sourceProvider: c.provider,
        sourceUrl: c.sourceUrl,
        externalId: c.externalId,
        licenceDetails: { ...c.licence, author: c.author, authorUrl: c.authorUrl } as unknown as Prisma.InputJsonValue,
        matchConfidence: score,
        assetProcessingStatus: 'PENDING' as const,
        identityVerificationStatus: 'UNVERIFIED' as const,
        metadata: {
          name: c.name,
          tags: c.tags.slice(0, 20),
          reasons,
          faceCount: c.faceCount ?? null,
          vertexCount: c.vertexCount ?? null,
          archives: c.archives,
          downloadable: c.downloadable,
          publishedAt: c.publishedAt ?? null,
          autoImportEligible: score >= AUTO_IMPORT_MIN_CONFIDENCE && c.licence.autoImportAllowed,
        } as unknown as Prisma.InputJsonValue,
      };
      const existing = await this.prisma.vehicleAsset.findFirst({
        where: { vehicleId, assetType: 'MODEL_CANDIDATE', sourceProvider: c.provider, externalId: c.externalId },
      });
      saved.push(
        existing
          ? await this.prisma.vehicleAsset.update({ where: { id: existing.id }, data })
          : await this.prisma.vehicleAsset.create({ data: { ...data, vehicleId } }),
      );
    }
    return saved;
  }

  canAutoImport(c: ScoredCandidate): { ok: boolean; reason: string } {
    const provider = this.providers.find((p) => p.id === c.candidate.provider);
    if (c.score < AUTO_IMPORT_MIN_CONFIDENCE) return { ok: false, reason: `confidence ${c.score} below ${AUTO_IMPORT_MIN_CONFIDENCE}` };
    if (!c.candidate.licence.autoImportAllowed) return { ok: false, reason: `licence "${c.candidate.licence.label}" requires admin review` };
    if (!provider?.canDownload()) return { ok: false, reason: `${c.candidate.provider} download credentials not configured` };
    const size = c.candidate.archives.glb?.sizeBytes ?? c.candidate.archives.gltf?.sizeBytes ?? 0;
    if (!size) return { ok: false, reason: 'no GLB/glTF archive' };
    if (size > MAX_MODEL_BYTES) return { ok: false, reason: `archive ${(size / 1e6).toFixed(1)} MB above limit` };
    return { ok: true, reason: 'eligible' };
  }

  /**
   * Download a candidate, convert to GLB and store it as the active source.
   * Identity stays UNVERIFIED until an admin confirms the match.
   */
  async importCandidate(vehicleId: string, candidateAssetId: string, opts: { licenceAcknowledged: boolean; byUserId?: string }) {
    const cand = await this.prisma.vehicleAsset.findFirst({
      where: { id: candidateAssetId, vehicleId, assetType: 'MODEL_CANDIDATE' },
    });
    if (!cand) throw new NotFoundException('Candidate not found');
    const licence = (cand.licenceDetails || {}) as unknown as LicenceInfo;
    if (!licence.autoImportAllowed && !opts.licenceAcknowledged) {
      throw new BadRequestException(`Licence "${licence.label}" must be reviewed and acknowledged before import`);
    }
    const provider = this.providers.find((p) => p.id === cand.sourceProvider);
    if (!provider) throw new BadRequestException(`Unknown provider ${cand.sourceProvider}`);
    if (!provider.canDownload()) {
      throw new BadRequestException(`${provider.id} downloads need an API token (set SKETCHFAB_API_TOKEN on the server)`);
    }

    await this.prisma.vehicleAsset.update({ where: { id: cand.id }, data: { assetProcessingStatus: 'PROCESSING' } });
    try {
      const downloaded = await provider.download(cand.externalId!, MAX_MODEL_BYTES);
      const glb = await toGlb(downloaded.buffer, downloaded.format, MAX_MODEL_BYTES);
      const stored = await this.storage.put(`vehicles/${vehicleId}/models`, `${cand.sourceProvider}-${cand.externalId}.glb`, glb);

      await this.supersede(vehicleId, 'MODEL_3D_SOURCE');
      const asset = await this.prisma.vehicleAsset.create({
        data: {
          vehicleId,
          assetType: 'MODEL_3D_SOURCE',
          label: 'active',
          assetUrl: stored.url,
          storageKey: stored.storageKey,
          previewUrl: cand.previewUrl,
          sourceProvider: cand.sourceProvider,
          sourceUrl: cand.sourceUrl,
          externalId: cand.externalId,
          licenceDetails: { ...(cand.licenceDetails as object), acknowledgedByUserId: opts.byUserId ?? null, acknowledgedAt: new Date().toISOString() },
          matchConfidence: cand.matchConfidence,
          identityVerificationStatus: 'UNVERIFIED',
          assetProcessingStatus: 'PENDING',
          contentHash: stored.contentHash,
          fileSizeBytes: stored.sizeBytes,
          metadata: { candidateAssetId: cand.id, originalFormat: downloaded.format, candidateName: cand.label },
        },
      });
      await this.prisma.vehicleAsset.update({ where: { id: cand.id }, data: { assetProcessingStatus: 'READY' } });
      return asset;
    } catch (err) {
      await this.prisma.vehicleAsset.update({
        where: { id: cand.id },
        data: { assetProcessingStatus: 'FAILED', validationReport: { importError: (err as Error).message } },
      });
      throw err;
    }
  }

  /** Mark previously active assets of a type as superseded (kept for provenance). */
  async supersede(vehicleId: string, assetType: 'MODEL_3D_SOURCE' | 'MODEL_3D_WEB') {
    await this.prisma.vehicleAsset.updateMany({
      where: { vehicleId, assetType, label: 'active' },
      data: { label: 'superseded' },
    });
  }
}
