// Types mirroring the NestJS configurator API (apps/api/src/modules/configurator).

export type AssetPipelineStatus =
  | 'DRAFT' | 'SEARCHING_MODEL' | 'EXACT_MODEL_FOUND' | 'MODEL_UNAVAILABLE' | 'AI_PREVIEW_GENERATION'
  | 'PREPARING_3D_ASSETS' | 'MAPPING_MATERIALS' | 'GENERATING_PREVIEWS' | 'VALIDATING_ASSETS'
  | 'READY_FOR_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'FAILED';

export type IdentityStatus = 'UNVERIFIED' | 'VERIFIED_EXACT' | 'APPROVED_APPROXIMATE' | 'REJECTED' | 'NOT_APPLICABLE';

export type JobStatus = 'QUEUED' | 'RUNNING' | 'WAITING_FOR_INPUT' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type PaintFinish = 'solid' | 'metallic' | 'pearl' | 'matte';

export interface RenderingParameters {
  baseColor: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  iridescence?: number;
  finish?: PaintFinish;
}

export interface Colour {
  id: string;
  name: string;
  manufacturerPaintCode: string | null;
  previewHex: string;
  finish: PaintFinish;
  renderingParameters: RenderingParameters | null;
  availabilityStatus: 'AVAILABLE' | 'DISCONTINUED' | 'UNVERIFIED';
  sortOrder: number;
}

export type MaterialCategory =
  | 'BODY_PAINT' | 'GLASS' | 'TYRE' | 'WHEEL' | 'LIGHT' | 'TRIM' | 'INTERIOR' | 'BADGE' | 'UNDERBODY' | 'OTHER';

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  'BODY_PAINT', 'GLASS', 'TYRE', 'WHEEL', 'LIGHT', 'TRIM', 'INTERIOR', 'BADGE', 'UNDERBODY', 'OTHER',
];

export interface MaterialMappingEntry {
  name: string;
  index: number;
  category: MaterialCategory;
  confidence: number;
  reason: string;
  triangleShare: number;
  hasBaseColorTexture: boolean;
  confirmedByAdmin: boolean;
}

export interface MaterialMapping {
  status: 'ok' | 'needs_confirmation' | 'needs_preparation';
  bodyPaintMaterials: string[];
  entries: MaterialMappingEntry[];
  issues: string[];
  classifiedAt: string;
  method: 'heuristic' | 'admin';
}

export interface LicenceDetails {
  label?: string;
  url?: string | null;
  requiresAttribution?: boolean;
  allowsCommercialUse?: boolean;
  allowsDerivatives?: boolean;
  autoImportAllowed?: boolean;
  attributionText?: string | null;
  author?: string | null;
}

export interface VehicleAsset {
  id: string;
  vehicleId: string;
  assetType:
    | 'MODEL_3D_SOURCE' | 'MODEL_3D_WEB' | 'MODEL_CANDIDATE' | 'REFERENCE_IMAGE'
    | 'RENDER_PREVIEW' | 'AI_PREVIEW' | 'THUMBNAIL';
  assetUrl: string | null;
  previewUrl: string | null;
  label: string | null;
  sourceProvider: string;
  sourceUrl: string | null;
  externalId: string | null;
  licenceDetails: LicenceDetails | null;
  identityVerificationStatus: IdentityStatus;
  assetProcessingStatus: 'PENDING' | 'PROCESSING' | 'READY' | 'NEEDS_PREPARATION' | 'FAILED';
  matchConfidence: number | null;
  materialMappings: MaterialMapping | null;
  validationReport: any;
  metadata: any;
  fileSizeBytes: number | null;
  isGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobLogEntry {
  at: string;
  stage: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface AssetJob {
  id: string;
  jobStatus: JobStatus;
  progress: number;
  processingStage: AssetPipelineStatus;
  stagesCompleted: string[];
  errorMessage: string | null;
  errorStage: AssetPipelineStatus | null;
  retryCount: number;
  maxRetries: number;
  log: JobLogEntry[] | null;
  costLog: Array<{ provider: string; operation: string; units: number; estimatedUsd: number }> | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface QaReport {
  passed: boolean;
  warnings: string[];
  blocking: string[];
  checkedAt: string;
}

export interface AdminVehicle {
  id: string;
  slug: string;
  variant: string | null;
  year: number;
  generation: string | null;
  market: string | null;
  bodyStyle: string;
  fuelType: string;
  transmission: string;
  drivetrain: string | null;
  price: number;
  currency: string;
  priceVerified: boolean;
  manufacturerUrl: string | null;
  description: string | null;
  specifications: Record<string, unknown> | null;
  interiorOptions: string[];
  wheelOptions: string[];
  assetStatus: AssetPipelineStatus;
  publicationStatus: 'PUBLISHED' | 'UNPUBLISHED';
  brand: { id: string; name: string };
  model: { id: string; name: string };
  colours: Colour[];
  assets: VehicleAsset[];
  assetJobs: AssetJob[];
  providers: Array<{ id: string; searchEnabled: boolean; downloadEnabled: boolean }>;
  aiImagesEnabled: boolean;
  qa: QaReport;
}

export interface AdminVehicleListItem {
  id: string;
  slug: string;
  make: string;
  model: string;
  year: number;
  variant: string | null;
  market: string | null;
  assetStatus: AssetPipelineStatus;
  publicationStatus: 'PUBLISHED' | 'UNPUBLISHED';
  colourCount: number;
  identity: IdentityStatus | null;
  thumbnailUrl: string | null;
  thumbnailIsAi: boolean;
  latestJob: Pick<AssetJob, 'id' | 'jobStatus' | 'progress' | 'processingStage' | 'errorMessage' | 'updatedAt'> | null;
  updatedAt: string;
}

export interface PublicColour {
  imageUrl?: string | null;
  id: string;
  name: string;
  paintCode: string | null;
  hex: string;
  finish: PaintFinish;
  verified: boolean;
  rendering: RenderingParameters | null;
}

export interface PublicVehicle {
  images?: Array<{ id: string; url: string; alt: string }>;
  features?: string[];
  id: string;
  slug: string;
  make: string;
  model: string;
  year: number;
  variant: string | null;
  generation: string | null;
  market: string | null;
  bodyType: string;
  fuelType: string;
  transmission: string;
  drivetrain: string | null;
  interiorOptions: string[];
  wheelOptions: string[];
  description: string | null;
  price: { amount: number; currency: string; verified: boolean; label: string } | null;
  specifications: Record<string, unknown> | null;
  specificationsSource: { url: string } | null;
  model3d: {
    url: string;
    sizeBytes: number | null;
    identity: IdentityStatus;
    identityLabel: string;
    bodyPaintMaterials: string[];
    scaleToMeters: number;
    lengthAxis: 'X' | 'Y' | 'Z';
    attribution: { text: string; licence: string; licenceUrl: string | null; sourceUrl: string | null } | null;
  } | null;
  colours: PublicColour[];
  renders: Array<{ label: string; url: string; type: string }>;
  aiPreviews: Array<{ id: string; label: string; assetUrl: string; aiGenerated: true; disclaimer: string }>;
  variants: Array<{ slug: string; variant: string | null; year: number; fuelType: string; transmission: string; price: number; currency: string; priceVerified: boolean }>;
}

export const CAMERA_VIEWS = ['front-three-quarter', 'front', 'rear', 'left', 'right', 'top', 'interior'] as const;
export type CameraView = (typeof CAMERA_VIEWS)[number];

export const STATUS_LABELS: Record<AssetPipelineStatus, string> = {
  DRAFT: 'Draft',
  SEARCHING_MODEL: 'Searching for 3D model',
  EXACT_MODEL_FOUND: '3D model found',
  MODEL_UNAVAILABLE: 'Exact 3D model unavailable',
  AI_PREVIEW_GENERATION: 'Generating AI previews',
  PREPARING_3D_ASSETS: 'Preparing 3D assets',
  MAPPING_MATERIALS: 'Mapping materials',
  GENERATING_PREVIEWS: 'Generating previews',
  VALIDATING_ASSETS: 'Validating assets',
  READY_FOR_REVIEW: 'Ready for review',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
  FAILED: 'Failed',
};

export function formatPrice(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
