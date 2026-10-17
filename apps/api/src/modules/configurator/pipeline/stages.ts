import { AssetPipelineStatus } from '@prisma/client';

/**
 * Ordered pipeline stages. Each stage is idempotent and records itself in
 * AssetGenerationJob.stagesCompleted, so a job can resume or be retried from
 * the stage that failed without redoing earlier work.
 */
export const PIPELINE_STAGES = [
  'VALIDATE_INPUT',
  'SEARCH_MODEL',
  'AI_PREVIEWS',
  'PREPARE_3D',
  'MAP_MATERIALS',
  'GENERATE_PREVIEWS',
  'QUALITY_ASSURANCE',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

/** Vehicle-facing status shown while each stage runs. */
export const STAGE_STATUS: Record<PipelineStage, AssetPipelineStatus> = {
  VALIDATE_INPUT: 'DRAFT',
  SEARCH_MODEL: 'SEARCHING_MODEL',
  AI_PREVIEWS: 'AI_PREVIEW_GENERATION',
  PREPARE_3D: 'PREPARING_3D_ASSETS',
  MAP_MATERIALS: 'MAPPING_MATERIALS',
  GENERATE_PREVIEWS: 'GENERATING_PREVIEWS',
  QUALITY_ASSURANCE: 'VALIDATING_ASSETS',
};

/** Progress percentage reached once a stage completes. */
export const STAGE_PROGRESS: Record<PipelineStage, number> = {
  VALIDATE_INPUT: 5,
  SEARCH_MODEL: 20,
  AI_PREVIEWS: 45,
  PREPARE_3D: 65,
  MAP_MATERIALS: 80,
  GENERATE_PREVIEWS: 90,
  QUALITY_ASSURANCE: 100,
};

export function isPipelineStage(value: string): value is PipelineStage {
  return (PIPELINE_STAGES as readonly string[]).includes(value);
}

/** Stages strictly before `stage` — used when reprocessing from a given stage. */
export function stagesBefore(stage: PipelineStage): PipelineStage[] {
  return PIPELINE_STAGES.slice(0, PIPELINE_STAGES.indexOf(stage)) as PipelineStage[];
}

/**
 * Thrown by a stage when it cannot continue without admin action
 * (e.g. no exact 3D model, ambiguous body-paint materials).
 * The job moves to WAITING_FOR_INPUT rather than FAILED.
 */
export class WaitingForInputError extends Error {
  constructor(
    message: string,
    public readonly vehicleStatus: AssetPipelineStatus,
  ) {
    super(message);
    this.name = 'WaitingForInputError';
  }
}

/** Errors worth retrying automatically with backoff (network / provider 5xx / rate limit). */
export class TransientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransientError';
  }
}
