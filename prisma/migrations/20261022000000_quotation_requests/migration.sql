CREATE TYPE "QuotationStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');
CREATE TABLE "QuotationRequest" (
 "id" TEXT NOT NULL, "requestKey" TEXT NOT NULL, "inputHash" TEXT NOT NULL,
 "vehicleSnapshot" JSONB NOT NULL, "phone" TEXT NOT NULL, "email" TEXT NOT NULL,
 "consentVersion" INTEGER NOT NULL DEFAULT 1, "status" "QuotationStatus" NOT NULL DEFAULT 'NEW',
 "version" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "QuotationRequest_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "QuotationRequest_version_check" CHECK ("version">=0)
);
CREATE UNIQUE INDEX "QuotationRequest_requestKey_key" ON "QuotationRequest"("requestKey");
CREATE INDEX "QuotationRequest_status_createdAt_idx" ON "QuotationRequest"("status","createdAt");
CREATE INDEX "QuotationRequest_createdAt_idx" ON "QuotationRequest"("createdAt");
CREATE TABLE "QuotationRevision" (
 "id" TEXT NOT NULL, "requestId" TEXT NOT NULL, "number" INTEGER NOT NULL,
 "snapshot" JSONB NOT NULL, "totalPaise" INTEGER NOT NULL, "pdf" BYTEA NOT NULL,
 "sha256" TEXT NOT NULL, "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "QuotationRevision_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "QuotationRevision_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "QuotationRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "QuotationRevision_amount_check" CHECK ("totalPaise">0 AND "totalPaise"<=2000000000 AND "number">0),
 CONSTRAINT "QuotationRevision_pdf_check" CHECK (octet_length("pdf")>0 AND octet_length("pdf")<=2097152)
);
CREATE UNIQUE INDEX "QuotationRevision_requestId_number_key" ON "QuotationRevision"("requestId","number");
CREATE TABLE "QuotationThrottle" (
 "key" TEXT NOT NULL, "bucket" TIMESTAMP(3) NOT NULL, "count" INTEGER NOT NULL,
 CONSTRAINT "QuotationThrottle_pkey" PRIMARY KEY ("key"), CONSTRAINT "QuotationThrottle_count_check" CHECK ("count">0)
);
CREATE INDEX "QuotationThrottle_bucket_idx" ON "QuotationThrottle"("bucket");
