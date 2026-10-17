import { Injectable, Logger } from '@nestjs/common';
import { AssetGenerationJob, Prisma, VehicleColour } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ModelDiscoveryService, toVehicleQuery } from '../discovery/model-discovery.service';
import { inspectGlb, InspectionReport } from '../gltf/gltf-inspector';
import { optimizeForWeb } from '../gltf/gltf-optimizer';
import { classifyMaterials, MaterialMapping } from '../gltf/material-classifier';
import { buildRenderingParameters, isHexColour } from '../colours/colour-presets';
import { OpenAIImageProvider } from '../images/openai-image.provider';
import { buildAnglePrompt, buildRecolourPrompt, PREVIEW_ANGLES, PromptVehicle } from '../images/prompt-builder';
import { PipelineStage, WaitingForInputError } from './stages';

export const pipelineVehicleInclude = {
  brand: true,
  model: true,
  colours: { orderBy: { sortOrder: 'asc' } },
} satisfies Prisma.VehicleInclude;

export type PipelineVehicle = Prisma.VehicleGetPayload<{ include: typeof pipelineVehicleInclude }>;

export interface CostEntry {
  provider: string;
  operation: string;
  units: number;
  estimatedUsd: number;
  at?: string;
}

export interface StageContext {
  job: AssetGenerationJob;
  vehicle: PipelineVehicle;
  log(level: 'info' | 'warn' | 'error', message: string): Promise<void>;
  cost(entry: CostEntry): Promise<void>;
  /** Report progress within the current stage (absolute 0–100) and refresh the job lock. */
  heartbeat(progress?: number): Promise<void>;
}

/** Renders the admin review page captures from the real 3D geometry. */
export const REQUIRED_RENDER_VIEWS = ['front-three-quarter', 'front', 'rear', 'left', 'right', 'top'] as const;
export const LARGE_MODEL_WARN_BYTES = 15 * 1024 * 1024;
const MAX_AI_IMAGES = Number(process.env.AI_PREVIEW_MAX_IMAGES || 12);

export const AI_DISCLAIMER =
  'AI-generated marketing preview. Not a photograph of the vehicle and not derived from the 3D model; details may differ from the production car.';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly discovery: ModelDiscoveryService,
    private readonly images: OpenAIImageProvider,
  ) {}

  loadVehicle(vehicleId: string) {
    return this.prisma.vehicle.findUniqueOrThrow({ where: { id: vehicleId }, include: pipelineVehicleInclude });
  }

  async runStage(stage: PipelineStage, ctx: StageContext): Promise<void> {
    switch (stage) {
      case 'VALIDATE_INPUT':
        return this.validateInput(ctx);
      case 'SEARCH_MODEL':
        return this.searchModel(ctx);
      case 'AI_PREVIEWS':
        return this.aiPreviews(ctx);
      case 'PREPARE_3D':
        return this.prepare3d(ctx);
      case 'MAP_MATERIALS':
        return this.mapMaterials(ctx);
      case 'GENERATE_PREVIEWS':
        return this.generatePreviews(ctx);
      case 'QUALITY_ASSURANCE':
        return this.qualityAssurance(ctx);
    }
  }

  // ── A0. Input validation ──────────────────────────────────────────────
  private async validateInput({ vehicle, log }: StageContext) {
    const problems: string[] = [];
    if (!vehicle.brand?.name) problems.push('Manufacturer is missing');
    if (!vehicle.model?.name) problems.push('Model name is missing');
    if (!vehicle.year || vehicle.year < 1950 || vehicle.year > new Date().getFullYear() + 2) problems.push(`Model year ${vehicle.year} is out of range`);
    if (vehicle.colours.length === 0) problems.push('At least one exterior colour is required');
    for (const c of vehicle.colours) {
      if (!isHexColour(c.previewHex)) problems.push(`Colour "${c.name}" has an invalid rendering hex "${c.previewHex}"`);
    }
    if (problems.length) throw new Error(`Vehicle details invalid: ${problems.join('; ')}`);
    await log('info', `Validated ${vehicle.year} ${vehicle.brand.name} ${vehicle.model.name} ${vehicle.variant || ''} with ${vehicle.colours.length} colour(s)`);
  }

  // ── A. Asset discovery ────────────────────────────────────────────────
  private async searchModel(ctx: StageContext) {
    const { vehicle, log } = ctx;
    const active = await this.discovery.activeSource(vehicle.id);
    if (active) {
      await log('info', `Using existing source model from ${active.sourceProvider} (identity: ${active.identityVerificationStatus})`);
      await this.setStatus(vehicle.id, active.identityVerificationStatus === 'VERIFIED_EXACT' ? 'EXACT_MODEL_FOUND' : 'SEARCHING_MODEL');
      return;
    }

    const internal = await this.discovery.findInternalExact(vehicle);
    if (internal) {
      const sameVariant = (internal.vehicle.variant || '') === (vehicle.variant || '');
      await this.discovery.reuseInternal(vehicle.id, internal, sameVariant);
      await log('info', `Reused verified catalogue model from vehicle ${internal.vehicle.id}${sameVariant ? '' : ' (different variant — identity needs confirmation)'}`);
      await this.setStatus(vehicle.id, 'EXACT_MODEL_FOUND');
      return;
    }

    const query = toVehicleQuery(vehicle);
    const { results, errors } = await this.discovery.searchExternal(query, 8);
    errors.forEach((e) => log('warn', `Provider error — ${e}`));
    const saved = await this.discovery.saveCandidates(vehicle.id, results);
    await log('info', `External search found ${results.length} plausible candidate(s)${results[0] ? `; best "${results[0].candidate.name}" (${results[0].score})` : ''}`);

    const best = results[0];
    if (best) {
      const eligibility = this.discovery.canAutoImport(best);
      if (eligibility.ok) {
        await log('info', `Auto-importing "${best.candidate.name}" (${best.candidate.licence.label}) — identity will still require admin verification`);
        await ctx.heartbeat();
        await this.discovery.importCandidate(vehicle.id, saved[0].id, { licenceAcknowledged: false });
        await this.setStatus(vehicle.id, 'EXACT_MODEL_FOUND');
        return;
      }
      await log('warn', `Best candidate not auto-imported: ${eligibility.reason}`);
    }

    // Do not block here: AI previews can still be produced; PREPARE_3D waits for the admin.
    await this.setStatus(vehicle.id, 'MODEL_UNAVAILABLE');
    await log('warn', `Exact 3D model unavailable — ${results.length} candidate(s) for review; upload a licensed GLB or select a candidate`);
  }

  // ── AI marketing previews (separate from 3D) ───────────────────────────
  private async aiPreviews(ctx: StageContext) {
    const { vehicle, log } = ctx;
    if (process.env.AI_PREVIEWS_ENABLED === 'false') {
      await log('info', 'AI previews disabled (AI_PREVIEWS_ENABLED=false) — skipped');
      return;
    }
    if (!this.images.isConfigured()) {
      await log('warn', 'OPENAI_API_KEY not configured — AI marketing previews skipped');
      return;
    }

    const pv: PromptVehicle = {
      make: vehicle.brand.name, model: vehicle.model.name, year: vehicle.year, variant: vehicle.variant,
      generation: vehicle.generation, market: vehicle.market, bodyStyle: vehicle.bodyStyle,
    };
    const references = await this.loadReferenceImages(vehicle.id);
    const primary = vehicle.colours[0];
    let generated = 0;
    let budget = MAX_AI_IMAGES;

    // 1. All camera angles in the primary colour.
    for (const angle of PREVIEW_ANGLES) {
      if (budget <= 0) break;
      const prompt = buildAnglePrompt(pv, angle, `${primary.name}`, references.length > 0);
      const made = await this.generateOnce(ctx, {
        label: `angle:${angle.key}`,
        prompt,
        refs: references,
        meta: { angle: angle.key, colourName: primary.name },
      });
      if (made) { generated++; budget--; }
      await ctx.heartbeat(20 + Math.round((PREVIEW_ANGLES.indexOf(angle) + 1) * 3));
    }

    // 2. Per-colour variants edited from the primary front-three-quarter image, so geometry stays consistent.
    const base = await this.prisma.vehicleAsset.findFirst({
      where: { vehicleId: vehicle.id, assetType: 'AI_PREVIEW', label: 'angle:front-three-quarter' },
      orderBy: { createdAt: 'desc' },
    });
    if (base?.storageKey) {
      const baseBuffer = await this.storage.read(base.storageKey);
      for (const colour of vehicle.colours) {
        if (budget <= 0) {
          await log('warn', `AI image budget (${MAX_AI_IMAGES}) reached; remaining colour previews skipped`);
          break;
        }
        if (colour.id === primary.id) continue;
        const prompt = buildRecolourPrompt(pv, colour.name, colour.previewHex, colour.finish);
        const made = await this.generateOnce(ctx, {
          label: `colour:${colour.name}`,
          prompt,
          refs: [{ buffer: baseBuffer, mimeType: 'image/png', filename: 'base.png' }],
          meta: { angle: 'front-three-quarter', colourName: colour.name, colourId: colour.id, baseAssetId: base.id },
        });
        if (made) { generated++; budget--; }
      }
    }
    await log('info', `AI previews: ${generated} new image(s) generated (existing identical prompts reused)`);
  }

  /** Generate one AI image unless an identical prompt+references result already exists. */
  private async generateOnce(
    ctx: StageContext,
    args: { label: string; prompt: string; refs: Array<{ buffer: Buffer; mimeType: string; filename: string }>; meta: Record<string, unknown> },
  ): Promise<boolean> {
    const hash = createHash('sha256')
      .update(args.prompt)
      .update(args.refs.map((r) => StorageService.hash(r.buffer)).join(','))
      .update(process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1')
      .digest('hex');
    const existing = await this.prisma.vehicleAsset.findFirst({
      where: { vehicleId: ctx.vehicle.id, assetType: 'AI_PREVIEW', label: args.label, metadata: { path: ['promptHash'], equals: hash } },
    });
    if (existing) return false;

    const img = await this.images.generate({ prompt: args.prompt, referenceImages: args.refs, size: '1536x1024' });
    const stored = await this.storage.put(`vehicles/${ctx.vehicle.id}/ai`, `${args.label.replace(':', '-')}.png`, img.buffer);
    await this.prisma.vehicleAsset.create({
      data: {
        vehicleId: ctx.vehicle.id,
        assetType: 'AI_PREVIEW',
        label: args.label,
        assetUrl: stored.url,
        previewUrl: stored.url,
        storageKey: stored.storageKey,
        sourceProvider: this.images.id,
        isGenerated: true,
        contentHash: stored.contentHash,
        identityVerificationStatus: 'UNVERIFIED',
        assetProcessingStatus: 'READY',
        fileSizeBytes: stored.sizeBytes,
        metadata: {
          ...args.meta,
          promptHash: hash,
          prompt: args.prompt,
          revisedPrompt: img.revisedPrompt ?? null,
          model: img.model,
          usedReferenceImages: args.refs.length,
          disclaimer: AI_DISCLAIMER,
        } as Prisma.InputJsonValue,
      },
    });
    await ctx.cost({ provider: this.images.id, operation: args.refs.length ? 'images.edit' : 'images.generate', units: 1, estimatedUsd: img.estimatedUsd });
    return true;
  }

  private async loadReferenceImages(vehicleId: string) {
    const refs = await this.prisma.vehicleAsset.findMany({
      where: { vehicleId, assetType: 'REFERENCE_IMAGE', storageKey: { not: null } },
      orderBy: { createdAt: 'asc' },
      take: 4,
    });
    const out: Array<{ buffer: Buffer; mimeType: string; filename: string }> = [];
    for (const r of refs) {
      try {
        const buffer = await this.storage.read(r.storageKey!);
        const mimeType = String((r.metadata as any)?.mimeType || 'image/jpeg');
        out.push({ buffer, mimeType, filename: `ref-${r.id}.${mimeType.split('/')[1] || 'jpg'}` });
      } catch {
        /* missing file — ignore */
      }
    }
    return out;
  }

  // ── B + F. Validation and web optimisation ─────────────────────────────
  private async prepare3d(ctx: StageContext) {
    const { vehicle, log } = ctx;
    const source = await this.discovery.activeSource(vehicle.id);
    if (!source?.storageKey) {
      throw new WaitingForInputError(
        'Exact 3D model unavailable — select a licensed candidate or upload a GLB, then retry. AI previews (if any) remain available as marketing images.',
        'MODEL_UNAVAILABLE',
      );
    }
    if (source.identityVerificationStatus === 'REJECTED') {
      throw new WaitingForInputError('The source model was rejected — replace it to continue', 'MODEL_UNAVAILABLE');
    }

    // Cache: an identical source file already optimised (same vehicle or catalogue reuse).
    const cached = await this.prisma.vehicleAsset.findFirst({
      where: {
        assetType: 'MODEL_3D_WEB',
        assetProcessingStatus: { in: ['READY', 'NEEDS_PREPARATION'] },
        metadata: { path: ['sourceHash'], equals: source.contentHash ?? '__none__' },
        storageKey: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.prisma.vehicleAsset.update({ where: { id: source.id }, data: { assetProcessingStatus: 'PROCESSING' } });
    const sourceBuffer = await this.storage.read(source.storageKey);
    const { report: sourceReport, document } = await inspectGlb(sourceBuffer);
    await this.prisma.vehicleAsset.update({
      where: { id: source.id },
      data: {
        validationReport: sourceReport as unknown as Prisma.InputJsonValue,
        assetProcessingStatus: sourceReport.ok ? 'READY' : 'FAILED',
      },
    });
    for (const w of sourceReport.warnings) await log('warn', `Source model: ${w}`);
    if (!sourceReport.ok || !document) {
      throw new WaitingForInputError(`Source model failed validation: ${sourceReport.errors.join('; ')}. Replace the model and retry.`, 'FAILED');
    }
    await log('info', `Source model OK: ${sourceReport.counts.triangles.toLocaleString()} triangles, ${sourceReport.counts.materials} materials, ${(sourceReport.sizeBytes / 1e6).toFixed(1)} MB`);
    await ctx.heartbeat(52);

    let webData: { storageKey: string; url: string; sizeBytes: number; contentHash: string; report: InspectionReport; steps: string[]; warnings: string[]; renamed: Record<string, string>; reusedFrom?: string };

    if (cached && (cached.validationReport as any)?.web) {
      const prev = cached.validationReport as any;
      webData = {
        storageKey: cached.storageKey!, url: cached.assetUrl!, sizeBytes: cached.fileSizeBytes || 0, contentHash: cached.contentHash || '',
        report: prev.web, steps: prev.optimisation?.steps || [], warnings: prev.optimisation?.warnings || [], renamed: prev.optimisation?.renamedMaterials || {},
        reusedFrom: cached.id,
      };
      await log('info', `Reused previously optimised web model (${cached.id}) for identical source file`);
    } else {
      const optimised = await optimizeForWeb(document, sourceReport.counts.triangles);
      await ctx.heartbeat(60);
      const { report: webReport } = await inspectGlb(optimised.buffer);
      if (!webReport.ok) throw new Error(`Optimised model failed validation: ${webReport.errors.join('; ')}`);
      const stored = await this.storage.put(`vehicles/${vehicle.id}/models`, 'web.glb', optimised.buffer);
      webData = {
        ...stored, report: webReport, steps: optimised.steps, warnings: optimised.warnings, renamed: optimised.renamedMaterials,
      };
      optimised.steps.forEach((s) => log('info', `Optimise: ${s}`));
      optimised.warnings.forEach((w) => log('warn', `Optimise: ${w}`));
      await log('info', `Web model ${(sourceReport.sizeBytes / 1e6).toFixed(1)} MB → ${(stored.sizeBytes / 1e6).toFixed(1)} MB, ${webReport.counts.triangles.toLocaleString()} triangles`);
    }

    if (webData.sizeBytes > LARGE_MODEL_WARN_BYTES) {
      await log('warn', `Web model is ${(webData.sizeBytes / 1e6).toFixed(1)} MB — heavy for mobile networks`);
    }

    // Preserve admin-confirmed material mappings if the previous web model came from the same source.
    const previousWeb = await this.prisma.vehicleAsset.findFirst({
      where: { vehicleId: vehicle.id, assetType: 'MODEL_3D_WEB', label: 'active' },
    });
    const keepMapping =
      previousWeb && (previousWeb.metadata as any)?.sourceHash === source.contentHash && (previousWeb.materialMappings as any)?.method === 'admin'
        ? previousWeb.materialMappings
        : null;

    await this.discovery.supersede(vehicle.id, 'MODEL_3D_WEB');
    await this.prisma.vehicleAsset.create({
      data: {
        vehicleId: vehicle.id,
        assetType: 'MODEL_3D_WEB',
        label: 'active',
        assetUrl: webData.url,
        storageKey: webData.storageKey,
        previewUrl: source.previewUrl,
        sourceProvider: source.sourceProvider,
        sourceUrl: source.sourceUrl,
        externalId: source.externalId,
        licenceDetails: source.licenceDetails ?? Prisma.JsonNull,
        identityVerificationStatus: source.identityVerificationStatus,
        assetProcessingStatus: 'READY',
        matchConfidence: source.matchConfidence,
        contentHash: webData.contentHash,
        fileSizeBytes: webData.sizeBytes,
        materialMappings: keepMapping ?? Prisma.JsonNull,
        validationReport: {
          source: { ok: sourceReport.ok, warnings: sourceReport.warnings, counts: sourceReport.counts, sizeBytes: sourceReport.sizeBytes, orientation: sourceReport.orientation, scale: sourceReport.scale },
          web: webData.report,
          optimisation: { steps: webData.steps, warnings: webData.warnings, renamedMaterials: webData.renamed, reusedFrom: webData.reusedFrom ?? null },
        } as unknown as Prisma.InputJsonValue,
        metadata: { sourceAssetId: source.id, sourceHash: source.contentHash },
      },
    });
  }

  // ── C + D. Material mapping and colour configuration ──────────────────
  private async mapMaterials(ctx: StageContext) {
    const { vehicle, log } = ctx;
    const web = await this.activeWeb(vehicle.id);
    if (!web) throw new Error('No prepared web model — re-run from PREPARE_3D');

    let mapping = web.materialMappings as unknown as MaterialMapping | null;
    if (mapping?.method === 'admin') {
      await log('info', `Keeping admin-confirmed material mapping (${mapping.bodyPaintMaterials.length} body-paint material(s))`);
    } else {
      const report = (web.validationReport as any)?.web as InspectionReport | undefined;
      if (!report?.materials) throw new Error('Web model has no inspection report');
      mapping = classifyMaterials(report.materials);
      await log('info', `Classified ${mapping.entries.length} material(s): body paint = ${mapping.bodyPaintMaterials.join(', ') || 'none'}`);
      mapping.issues.forEach((i) => log('warn', `Materials: ${i}`));
    }

    await this.prisma.vehicleAsset.update({
      where: { id: web.id },
      data: {
        materialMappings: mapping as unknown as Prisma.InputJsonValue,
        assetProcessingStatus: mapping.status === 'needs_preparation' ? 'NEEDS_PREPARATION' : 'READY',
      },
    });

    await this.ensureColourParameters(vehicle.colours);

    if (mapping.status === 'needs_preparation') {
      throw new WaitingForInputError(
        `Model needs material preparation: ${mapping.issues.join(' ')} Assign body-paint materials in the review page or upload a model with separate paint materials.`,
        'MAPPING_MATERIALS',
      );
    }
  }

  async ensureColourParameters(colours: VehicleColour[]) {
    for (const c of colours) {
      const params = buildRenderingParameters(c.previewHex, c.finish);
      const current = c.renderingParameters as any;
      if (!current || current.baseColor !== params.baseColor || current.finish !== c.finish) {
        await this.prisma.vehicleColour.update({
          where: { id: c.id },
          data: { renderingParameters: { ...params, finish: c.finish } as unknown as Prisma.InputJsonValue },
        });
      }
    }
  }

  // ── E. Preview generation (from real geometry) ─────────────────────────
  private async generatePreviews({ vehicle, log }: StageContext) {
    const web = await this.activeWeb(vehicle.id);
    if (!web) throw new Error('No prepared web model');
    const required = [
      ...REQUIRED_RENDER_VIEWS.map((v) => `view:${v}`),
      'thumbnail',
      ...vehicle.colours.map((c) => `colour:${c.name}`),
    ];
    await this.prisma.vehicleAsset.update({
      where: { id: web.id },
      data: { metadata: { ...(web.metadata as object), requiredRenders: required, renderSpec: { width: 1600, height: 1000, fov: 30, background: '#eef0ed', exposure: 1 } } },
    });
    const have = await this.prisma.vehicleAsset.count({
      where: { vehicleId: vehicle.id, assetType: { in: ['RENDER_PREVIEW', 'THUMBNAIL'] }, metadata: { path: ['webAssetId'], equals: web.id } },
    });
    await log('info', `Render queue: ${required.length} render(s) from the real 3D geometry (${have} already captured). They are captured automatically with identical camera/lighting when the review page opens.`);
  }

  // ── G. Quality assurance ───────────────────────────────────────────────
  private async qualityAssurance({ vehicle, log }: StageContext) {
    const qa = await this.buildQaReport(vehicle.id);
    const web = await this.activeWeb(vehicle.id);
    if (web) {
      await this.prisma.vehicleAsset.update({
        where: { id: web.id },
        data: { validationReport: { ...(web.validationReport as object), qa } as unknown as Prisma.InputJsonValue },
      });
    }
    qa.blocking.forEach((b) => log('warn', `QA (blocks approval): ${b}`));
    qa.warnings.forEach((w) => log('warn', `QA: ${w}`));
    await log('info', `QA complete — ${qa.passed.length} check(s) passed, ${qa.blocking.length} blocking, ${qa.warnings.length} warning(s)`);
    await this.setStatus(vehicle.id, 'READY_FOR_REVIEW');
  }

  /** Shared by the QA stage and the approval endpoint. */
  async buildQaReport(vehicleId: string) {
    const passed: string[] = [];
    const warnings: string[] = [];
    const blocking: string[] = [];
    const vehicle = await this.loadVehicle(vehicleId);
    const web = await this.activeWeb(vehicleId);

    if (!web) {
      blocking.push('No web-ready 3D model');
    } else {
      passed.push('Web model prepared');
      const mapping = web.materialMappings as unknown as MaterialMapping | null;
      if (!mapping || mapping.bodyPaintMaterials.length === 0) blocking.push('No body-paint material mapped');
      else if (mapping.status === 'needs_preparation') blocking.push('Material mapping needs preparation');
      else if (mapping.status === 'needs_confirmation' && mapping.method !== 'admin') blocking.push('Material mapping must be confirmed by an admin');
      else passed.push(`Body paint mapped to ${mapping.bodyPaintMaterials.length} material(s)`);

      if ((web.fileSizeBytes || 0) > LARGE_MODEL_WARN_BYTES) warnings.push(`Web model ${(web.fileSizeBytes! / 1e6).toFixed(1)} MB exceeds 15 MB`);
      else passed.push('Web model size within budget');

      const lic = web.licenceDetails as any;
      if (web.sourceProvider !== 'admin-upload' && !lic?.label) blocking.push('Licence details missing');
      else if (web.sourceProvider === 'admin-upload' && !lic?.label) blocking.push('Uploaded model has no licence recorded');
      else passed.push(`Licence recorded: ${lic.label}`);
      if (lic?.requiresAttribution && !lic?.attributionText) warnings.push('Licence requires attribution but no attribution text is stored');

      if (web.identityVerificationStatus === 'UNVERIFIED') blocking.push('Model identity not verified — mark it exact or explicitly approve as approximate');
      else if (web.identityVerificationStatus === 'REJECTED') blocking.push('Model identity rejected');
      else passed.push(web.identityVerificationStatus === 'VERIFIED_EXACT' ? 'Identity verified exact' : 'Approved as approximate (will be labelled)');

      const report = (web.validationReport as any)?.web as InspectionReport | undefined;
      if (report && !report.orientation.ok) warnings.push(report.orientation.note);
      if (report && report.scale.unitGuess === 'unknown') warnings.push('Model scale could not be determined');

      const renders = await this.prisma.vehicleAsset.count({
        where: { vehicleId, assetType: { in: ['RENDER_PREVIEW', 'THUMBNAIL'] }, metadata: { path: ['webAssetId'], equals: web.id } },
      });
      if (renders === 0) warnings.push('Geometry renders not captured yet (open the review page)');
      else passed.push(`${renders} geometry render(s) captured`);
    }

    const validColours = vehicle.colours.filter((c) => isHexColour(c.previewHex));
    if (validColours.length === 0) blocking.push('No valid exterior colours');
    else passed.push(`${validColours.length} colour(s) configured`);
    const unverified = vehicle.colours.filter((c) => c.availabilityStatus === 'UNVERIFIED');
    if (unverified.length) warnings.push(`${unverified.length} colour(s) not verified against manufacturer data`);
    if (!vehicle.colours.some((c) => c.manufacturerPaintCode)) warnings.push('No manufacturer paint codes recorded');
    if (!vehicle.priceVerified) warnings.push('Price not verified — will be shown as indicative');

    const aiCount = await this.prisma.vehicleAsset.count({ where: { vehicleId, assetType: 'AI_PREVIEW' } });
    if (aiCount) passed.push(`${aiCount} AI marketing preview(s) (labelled as AI-generated)`);

    return { passed, warnings, blocking, checkedAt: new Date().toISOString() };
  }

  activeWeb(vehicleId: string) {
    return this.prisma.vehicleAsset.findFirst({
      where: { vehicleId, assetType: 'MODEL_3D_WEB', label: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }

  private setStatus(vehicleId: string, status: Prisma.VehicleUpdateInput['assetStatus']) {
    return this.prisma.vehicle.update({ where: { id: vehicleId }, data: { assetStatus: status } });
  }
}
