-- CreateEnum
CREATE TYPE "AssetPipelineStatus" AS ENUM ('DRAFT', 'SEARCHING_MODEL', 'EXACT_MODEL_FOUND', 'MODEL_UNAVAILABLE', 'AI_PREVIEW_GENERATION', 'PREPARING_3D_ASSETS', 'MAPPING_MATERIALS', 'GENERATING_PREVIEWS', 'VALIDATING_ASSETS', 'READY_FOR_REVIEW', 'APPROVED', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('UNPUBLISHED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('MODEL_3D_SOURCE', 'MODEL_3D_WEB', 'MODEL_CANDIDATE', 'REFERENCE_IMAGE', 'RENDER_PREVIEW', 'AI_PREVIEW', 'THUMBNAIL');

-- CreateEnum
CREATE TYPE "IdentityVerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED_EXACT', 'APPROVED_APPROXIMATE', 'REJECTED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "AssetProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'NEEDS_PREPARATION', 'FAILED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'WAITING_FOR_INPUT', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ColourAvailability" AS ENUM ('AVAILABLE', 'DISCONTINUED', 'UNVERIFIED');

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "assetStatus" "AssetPipelineStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "configuratorPublishedAt" TIMESTAMP(3),
ADD COLUMN     "generation" TEXT,
ADD COLUMN     "interiorOptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "manufacturerUrl" TEXT,
ADD COLUMN     "market" TEXT,
ADD COLUMN     "priceVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'UNPUBLISHED',
ADD COLUMN     "specifications" JSONB,
ADD COLUMN     "wheelOptions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "VehicleAsset" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "assetUrl" TEXT,
    "storageKey" TEXT,
    "previewUrl" TEXT,
    "label" TEXT,
    "sourceProvider" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "externalId" TEXT,
    "licenceDetails" JSONB,
    "identityVerificationStatus" "IdentityVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "assetProcessingStatus" "AssetProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "matchConfidence" DOUBLE PRECISION,
    "materialMappings" JSONB,
    "validationReport" JSONB,
    "metadata" JSONB,
    "contentHash" TEXT,
    "fileSizeBytes" INTEGER,
    "isGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleColour" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturerPaintCode" TEXT,
    "previewHex" TEXT NOT NULL,
    "finish" TEXT NOT NULL DEFAULT 'metallic',
    "renderingParameters" JSONB,
    "availabilityStatus" "ColourAvailability" NOT NULL DEFAULT 'UNVERIFIED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleColour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetGenerationJob" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "jobStatus" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "processingStage" "AssetPipelineStatus" NOT NULL DEFAULT 'DRAFT',
    "stagesCompleted" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "errorMessage" TEXT,
    "errorStage" "AssetPipelineStatus",
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "dedupeKey" TEXT,
    "log" JSONB,
    "costLog" JSONB,
    "requestedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AssetGenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedConfiguration" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "selectedVariant" TEXT,
    "selectedColour" TEXT,
    "selectedOptions" JSONB,
    "cameraState" JSONB,
    "shareToken" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleAsset_vehicleId_assetType_idx" ON "VehicleAsset"("vehicleId", "assetType");

-- CreateIndex
CREATE INDEX "VehicleAsset_contentHash_idx" ON "VehicleAsset"("contentHash");

-- CreateIndex
CREATE INDEX "VehicleAsset_sourceProvider_externalId_idx" ON "VehicleAsset"("sourceProvider", "externalId");

-- CreateIndex
CREATE INDEX "VehicleColour_vehicleId_idx" ON "VehicleColour"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleColour_vehicleId_name_key" ON "VehicleColour"("vehicleId", "name");

-- CreateIndex
CREATE INDEX "AssetGenerationJob_jobStatus_nextRunAt_idx" ON "AssetGenerationJob"("jobStatus", "nextRunAt");

-- CreateIndex
CREATE INDEX "AssetGenerationJob_vehicleId_idx" ON "AssetGenerationJob"("vehicleId");

-- CreateIndex
CREATE INDEX "AssetGenerationJob_dedupeKey_idx" ON "AssetGenerationJob"("dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "SavedConfiguration_shareToken_key" ON "SavedConfiguration"("shareToken");

-- CreateIndex
CREATE INDEX "SavedConfiguration_vehicleId_idx" ON "SavedConfiguration"("vehicleId");

-- CreateIndex
CREATE INDEX "Vehicle_assetStatus_idx" ON "Vehicle"("assetStatus");

-- CreateIndex
CREATE INDEX "Vehicle_publicationStatus_idx" ON "Vehicle"("publicationStatus");

-- AddForeignKey
ALTER TABLE "VehicleAsset" ADD CONSTRAINT "VehicleAsset_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleColour" ADD CONSTRAINT "VehicleColour_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetGenerationJob" ADD CONSTRAINT "AssetGenerationJob_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedConfiguration" ADD CONSTRAINT "SavedConfiguration_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
