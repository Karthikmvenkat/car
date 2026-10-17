import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AssetGenerationJob, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CostEntry, PipelineService, StageContext } from './pipeline.service';
import {
  isPipelineStage,
  PIPELINE_STAGES,
  PipelineStage,
  STAGE_PROGRESS,
  STAGE_STATUS,
  stagesBefore,
  TransientError,
  WaitingForInputError,
} from './stages';

const POLL_MS = Number(process.env.JOB_POLL_MS || 2000);
const STALE_LOCK_MS = 15 * 60 * 1000;
const ACTIVE: AssetGenerationJob['jobStatus'][] = ['QUEUED', 'RUNNING'];

/**
 * Postgres-backed job queue (no Redis needed). Jobs are claimed with
 * FOR UPDATE SKIP LOCKED so several API instances can run workers safely.
 * Each stage is recorded in stagesCompleted, so retries resume from the
 * failed stage instead of regenerating everything.
 */
@Injectable()
export class JobQueueService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(JobQueueService.name);
  private timer: NodeJS.Timeout | null = null;
  private busy = false;
  private stopping = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: PipelineService,
  ) {}

  onApplicationBootstrap() {
    if (process.env.ASSET_WORKER_ENABLED === 'false') {
      this.logger.log('Asset worker disabled (ASSET_WORKER_ENABLED=false)');
      return;
    }
    this.timer = setInterval(() => void this.tick(), POLL_MS);
    this.logger.log(`Asset worker polling every ${POLL_MS} ms`);
  }

  onModuleDestroy() {
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Enqueue processing for a vehicle. If a job is already queued/running for
   * the same vehicle it is returned instead of creating a duplicate.
   */
  async enqueue(vehicleId: string, opts: { fromStage?: PipelineStage; requestedById?: string; force?: boolean } = {}) {
    const dedupeKey = `vehicle:${vehicleId}`;
    const active = await this.prisma.assetGenerationJob.findFirst({
      where: { dedupeKey, jobStatus: { in: ACTIVE } },
      orderBy: { createdAt: 'desc' },
    });
    if (active) {
      if (!opts.force) return { job: active, deduplicated: true };
      throw new ConflictException('A job for this vehicle is already running');
    }

    // Close any job left waiting for input; the new job supersedes it.
    await this.prisma.assetGenerationJob.updateMany({
      where: { vehicleId, jobStatus: 'WAITING_FOR_INPUT' },
      data: { jobStatus: 'CANCELLED', completedAt: new Date() },
    });

    const fromStage = opts.fromStage ?? 'VALIDATE_INPUT';
    const job = await this.prisma.assetGenerationJob.create({
      data: {
        vehicleId,
        dedupeKey,
        requestedById: opts.requestedById,
        stagesCompleted: stagesBefore(fromStage),
        processingStage: STAGE_STATUS[fromStage],
        progress: fromStage === 'VALIDATE_INPUT' ? 0 : STAGE_PROGRESS[stagesBefore(fromStage).slice(-1)[0] ?? 'VALIDATE_INPUT'],
        log: [{ at: new Date().toISOString(), stage: fromStage, level: 'info', message: `Job queued from ${fromStage}` }],
      },
    });
    await this.prisma.vehicle.update({ where: { id: vehicleId }, data: { assetStatus: STAGE_STATUS[fromStage] } });
    return { job, deduplicated: false };
  }

  /** Re-run a failed / waiting job from the stage that stopped it (or a given stage). */
  async retry(jobId: string, fromStage?: string) {
    const job = await this.prisma.assetGenerationJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (ACTIVE.includes(job.jobStatus)) throw new ConflictException('Job is still active');
    if (fromStage && !isPipelineStage(fromStage)) throw new BadRequestException(`Unknown stage ${fromStage}`);

    const stage = (fromStage as PipelineStage | undefined) ?? this.firstIncomplete(job);
    const stagesCompleted = job.stagesCompleted.filter((s) => isPipelineStage(s) && stagesBefore(stage).includes(s));
    const updated = await this.prisma.assetGenerationJob.update({
      where: { id: jobId },
      data: {
        jobStatus: 'QUEUED',
        stagesCompleted,
        errorMessage: null,
        errorStage: null,
        nextRunAt: new Date(),
        lockedAt: null,
        completedAt: null,
        retryCount: { increment: 1 },
        log: this.appendLog(job.log, stage, 'info', `Manual retry from ${stage}`),
      },
    });
    // Cancel other waiting jobs for this vehicle so only one is live.
    await this.prisma.assetGenerationJob.updateMany({
      where: { vehicleId: job.vehicleId, id: { not: jobId }, jobStatus: { in: ['QUEUED', 'WAITING_FOR_INPUT'] } },
      data: { jobStatus: 'CANCELLED', completedAt: new Date() },
    });
    await this.prisma.vehicle.update({ where: { id: job.vehicleId }, data: { assetStatus: STAGE_STATUS[stage] } });
    return updated;
  }

  async cancel(jobId: string) {
    const job = await this.prisma.assetGenerationJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (['COMPLETED', 'CANCELLED'].includes(job.jobStatus)) return job;
    // A RUNNING stage finishes its current step; the runner checks status between stages.
    return this.prisma.assetGenerationJob.update({
      where: { id: jobId },
      data: { jobStatus: 'CANCELLED', completedAt: new Date(), log: this.appendLog(job.log, 'VALIDATE_INPUT', 'warn', 'Cancelled by admin') },
    });
  }

  /** Resume a vehicle's waiting job (after upload/import/mapping) or enqueue from a stage. */
  async resumeVehicle(vehicleId: string, fromStage: PipelineStage, requestedById?: string) {
    const waiting = await this.prisma.assetGenerationJob.findFirst({
      where: { vehicleId, jobStatus: { in: ['WAITING_FOR_INPUT', 'FAILED'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (waiting) return { job: await this.retry(waiting.id, fromStage), deduplicated: false };
    // Nothing has run yet for this vehicle (e.g. model uploaded at creation) — run the full pipeline.
    const previous = await this.prisma.assetGenerationJob.count({ where: { vehicleId } });
    return this.enqueue(vehicleId, { fromStage: previous ? fromStage : 'VALIDATE_INPUT', requestedById });
  }

  // ── Worker ─────────────────────────────────────────────────────────────

  private async tick() {
    if (this.busy || this.stopping) return;
    this.busy = true;
    try {
      await this.recoverStale();
      const id = await this.claim();
      if (id) await this.run(id);
    } catch (err) {
      this.logger.error(`Worker tick failed: ${(err as Error).message}`);
    } finally {
      this.busy = false;
    }
  }

  private async recoverStale() {
    await this.prisma.assetGenerationJob.updateMany({
      where: { jobStatus: 'RUNNING', lockedAt: { lt: new Date(Date.now() - STALE_LOCK_MS) } },
      data: { jobStatus: 'QUEUED', lockedAt: null },
    });
  }

  private async claim(): Promise<string | null> {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE "AssetGenerationJob"
         SET "jobStatus" = 'RUNNING', "lockedAt" = NOW(), "updatedAt" = NOW()
       WHERE id = (
         SELECT id FROM "AssetGenerationJob"
          WHERE "jobStatus" = 'QUEUED' AND "nextRunAt" <= NOW()
          ORDER BY "nextRunAt" ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
       )
      RETURNING id`;
    return rows[0]?.id ?? null;
  }

  private firstIncomplete(job: Pick<AssetGenerationJob, 'stagesCompleted'>): PipelineStage {
    return PIPELINE_STAGES.find((s) => !job.stagesCompleted.includes(s)) ?? 'QUALITY_ASSURANCE';
  }

  private async run(jobId: string) {
    let job = await this.prisma.assetGenerationJob.findUniqueOrThrow({ where: { id: jobId } });
    let currentStage: PipelineStage = this.firstIncomplete(job);

    const ctxFor = (vehicle: StageContext['vehicle']): StageContext => ({
      job,
      vehicle,
      log: async (level, message) => {
        const fresh = await this.prisma.assetGenerationJob.findUniqueOrThrow({ where: { id: jobId }, select: { log: true } });
        await this.prisma.assetGenerationJob.update({ where: { id: jobId }, data: { log: this.appendLog(fresh.log, currentStage, level, message) } });
        if (level !== 'info') this.logger.warn(`[${jobId}] ${currentStage}: ${message}`);
      },
      cost: async (entry: CostEntry) => {
        const fresh = await this.prisma.assetGenerationJob.findUniqueOrThrow({ where: { id: jobId }, select: { costLog: true } });
        const list = Array.isArray(fresh.costLog) ? (fresh.costLog as unknown as CostEntry[]) : [];
        list.push({ ...entry, at: new Date().toISOString() });
        await this.prisma.assetGenerationJob.update({ where: { id: jobId }, data: { costLog: list as unknown as Prisma.InputJsonValue } });
      },
      heartbeat: async (progress?: number) => {
        await this.prisma.assetGenerationJob.update({
          where: { id: jobId },
          data: { lockedAt: new Date(), ...(progress !== undefined ? { progress: Math.min(99, progress) } : {}) },
        });
      },
    });

    try {
      for (const stage of PIPELINE_STAGES) {
        if (job.stagesCompleted.includes(stage)) continue;
        currentStage = stage;

        const status = await this.prisma.assetGenerationJob.findUniqueOrThrow({ where: { id: jobId }, select: { jobStatus: true } });
        if (status.jobStatus === 'CANCELLED') return;

        await this.prisma.assetGenerationJob.update({
          where: { id: jobId },
          data: { processingStage: STAGE_STATUS[stage], lockedAt: new Date() },
        });
        // Stages that set a more specific status (EXACT_MODEL_FOUND / MODEL_UNAVAILABLE) override this.
        await this.prisma.vehicle.update({ where: { id: job.vehicleId }, data: { assetStatus: STAGE_STATUS[stage] } });

        const vehicle = await this.pipeline.loadVehicle(job.vehicleId);
        const started = Date.now();
        await this.pipeline.runStage(stage, ctxFor(vehicle));

        job = await this.prisma.assetGenerationJob.update({
          where: { id: jobId },
          data: {
            stagesCompleted: { push: stage },
            progress: STAGE_PROGRESS[stage],
            log: this.appendLog(
              (await this.prisma.assetGenerationJob.findUniqueOrThrow({ where: { id: jobId }, select: { log: true } })).log,
              stage, 'info', `Stage ${stage} completed in ${((Date.now() - started) / 1000).toFixed(1)}s`,
            ),
          },
        });
      }

      await this.prisma.assetGenerationJob.update({
        where: { id: jobId },
        data: { jobStatus: 'COMPLETED', progress: 100, processingStage: 'READY_FOR_REVIEW', completedAt: new Date(), lockedAt: null },
      });
    } catch (err) {
      await this.handleFailure(jobId, currentStage, err as Error);
    }
  }

  private async handleFailure(jobId: string, stage: PipelineStage, err: Error) {
    const job = await this.prisma.assetGenerationJob.findUniqueOrThrow({ where: { id: jobId } });

    if (err instanceof WaitingForInputError) {
      await this.prisma.assetGenerationJob.update({
        where: { id: jobId },
        data: {
          jobStatus: 'WAITING_FOR_INPUT',
          errorMessage: err.message,
          errorStage: STAGE_STATUS[stage],
          lockedAt: null,
          log: this.appendLog(job.log, stage, 'warn', `Waiting for admin: ${err.message}`),
        },
      });
      await this.prisma.vehicle.update({ where: { id: job.vehicleId }, data: { assetStatus: err.vehicleStatus } });
      return;
    }

    const transient = err instanceof TransientError;
    if (transient && job.retryCount < job.maxRetries) {
      const delayMs = Math.min(10 * 60_000, 15_000 * 2 ** job.retryCount);
      await this.prisma.assetGenerationJob.update({
        where: { id: jobId },
        data: {
          jobStatus: 'QUEUED',
          retryCount: { increment: 1 },
          nextRunAt: new Date(Date.now() + delayMs),
          lockedAt: null,
          errorMessage: err.message,
          errorStage: STAGE_STATUS[stage],
          log: this.appendLog(job.log, stage, 'warn', `Transient error, retrying in ${Math.round(delayMs / 1000)}s: ${err.message}`),
        },
      });
      return;
    }

    this.logger.error(`[${jobId}] ${stage} failed: ${err.message}`, err.stack);
    await this.prisma.assetGenerationJob.update({
      where: { id: jobId },
      data: {
        jobStatus: 'FAILED',
        errorMessage: err.message.slice(0, 2000),
        errorStage: STAGE_STATUS[stage],
        lockedAt: null,
        completedAt: new Date(),
        log: this.appendLog(job.log, stage, 'error', err.message),
      },
    });
    await this.prisma.vehicle.update({ where: { id: job.vehicleId }, data: { assetStatus: 'FAILED' } });
  }

  private appendLog(log: Prisma.JsonValue | null, stage: string, level: string, message: string): Prisma.InputJsonValue {
    const list = Array.isArray(log) ? [...log] : [];
    list.push({ at: new Date().toISOString(), stage, level, message: message.slice(0, 1000) });
    return list.slice(-200) as Prisma.InputJsonValue;
  }
}
