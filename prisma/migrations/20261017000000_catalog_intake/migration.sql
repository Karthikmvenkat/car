-- Additive private preparation records. No legacy data is updated or published.
CREATE TYPE "CatalogLicense" AS ENUM ('CC0', 'CC_BY_4_0', 'MANUFACTURER_PERMISSION');
CREATE TYPE "CatalogReviewStatus" AS ENUM ('READY_FOR_REVIEW', 'ACCEPTED', 'REJECTED');

CREATE TABLE "CatalogSource" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "host" TEXT NOT NULL,
  "license" "CatalogLicense" NOT NULL,
  "evidenceRef" TEXT NOT NULL,
  "attribution" TEXT NOT NULL,
  "commercialUse" BOOLEAN NOT NULL,
  "storageAllowed" BOOLEAN NOT NULL,
  "displayAllowed" BOOLEAN NOT NULL,
  "modificationAllowed" BOOLEAN NOT NULL,
  "policyVersion" INTEGER NOT NULL DEFAULT 1,
  "validUntil" TIMESTAMP(3) NOT NULL,
  "approvedById" TEXT NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "revokedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CatalogSource_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogSource_permissions_check" CHECK ("commercialUse" AND "storageAllowed" AND "displayAllowed" AND "modificationAllowed")
);

CREATE TABLE "CatalogCandidate" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "sourcePolicyVersion" INTEGER NOT NULL,
  "importKey" TEXT NOT NULL,
  "inputHash" TEXT NOT NULL,
  "dictionaryVersion" INTEGER NOT NULL DEFAULT 1,
  "identity" JSONB NOT NULL,
  "saleEvidenceUrl" TEXT NOT NULL,
  "saleObservedAt" TIMESTAMP(3) NOT NULL,
  "facts" JSONB NOT NULL,
  "submittedById" TEXT NOT NULL,
  "status" "CatalogReviewStatus" NOT NULL DEFAULT 'READY_FOR_REVIEW',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CatalogCandidate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogCandidate_review_check" CHECK (
    ("status" = 'READY_FOR_REVIEW' AND "reviewedById" IS NULL AND "reviewedAt" IS NULL AND "reviewNote" IS NULL) OR
    ("status" <> 'READY_FOR_REVIEW' AND "reviewedById" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "reviewNote" IS NOT NULL)
  )
);
CREATE UNIQUE INDEX "CatalogCandidate_sourceId_importKey_key" ON "CatalogCandidate"("sourceId", "importKey");
CREATE INDEX "CatalogCandidate_status_id_idx" ON "CatalogCandidate"("status", "id");
ALTER TABLE "CatalogCandidate" ADD CONSTRAINT "CatalogCandidate_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CatalogSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
