-- Additive private media only; no legacy images/listings are changed.
CREATE TABLE "CatalogMedia" (
 "id" TEXT NOT NULL,
 "candidateId" TEXT NOT NULL,
 "sourceId" TEXT NOT NULL,
 "sourcePolicyVersion" INTEGER NOT NULL,
 "importKey" TEXT NOT NULL,
 "inputHash" TEXT NOT NULL,
 "evidenceUrl" TEXT NOT NULL,
 "evidenceRef" TEXT NOT NULL,
 "creator" TEXT NOT NULL,
 "attribution" TEXT NOT NULL,
 "alt" TEXT NOT NULL,
 "acquiredAt" TIMESTAMP(3) NOT NULL,
 "originalHash" TEXT NOT NULL,
 "originalBytes" INTEGER NOT NULL,
 "originalFormat" TEXT NOT NULL,
 "width" INTEGER NOT NULL,
 "height" INTEGER NOT NULL,
 "storageKey" TEXT NOT NULL,
 "derivatives" JSONB NOT NULL,
 "recipeVersion" INTEGER NOT NULL DEFAULT 1,
 "submittedById" TEXT NOT NULL,
 "status" "CatalogReviewStatus" NOT NULL DEFAULT 'READY_FOR_REVIEW',
 "identityConfirmed" BOOLEAN NOT NULL DEFAULT false,
 "reviewedById" TEXT,
 "reviewedAt" TIMESTAMP(3),
 "reviewNote" TEXT,
 "withdrawnAt" TIMESTAMP(3),
 "withdrawnById" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "CatalogMedia_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "CatalogMedia_review_check" CHECK (
  ("status"='READY_FOR_REVIEW' AND "reviewedById" IS NULL AND "reviewedAt" IS NULL AND "reviewNote" IS NULL AND NOT "identityConfirmed") OR
  ("status"<>'READY_FOR_REVIEW' AND "reviewedById" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "reviewNote" IS NOT NULL AND ("status"<>'ACCEPTED' OR "identityConfirmed"))
 )
);
CREATE UNIQUE INDEX "CatalogMedia_storageKey_key" ON "CatalogMedia"("storageKey");
CREATE UNIQUE INDEX "CatalogMedia_candidateId_importKey_key" ON "CatalogMedia"("candidateId","importKey");
CREATE INDEX "CatalogMedia_candidateId_id_idx" ON "CatalogMedia"("candidateId","id");
ALTER TABLE "CatalogMedia" ADD CONSTRAINT "CatalogMedia_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CatalogCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogMedia" ADD CONSTRAINT "CatalogMedia_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CatalogSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
