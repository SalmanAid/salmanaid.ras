CREATE TYPE "CmsDocumentKey" AS ENUM ('PUBLIC_LANDING', 'BORROWER_SHELL', 'DONOR_SHELL');

CREATE TABLE "CmsDocument" (
    "id" UUID NOT NULL,
    "key" "CmsDocumentKey" NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "draftVersion" INTEGER NOT NULL DEFAULT 1,
    "publishedVersion" INTEGER NOT NULL DEFAULT 1,
    "draftContent" JSONB NOT NULL,
    "publishedContent" JSONB NOT NULL,
    "editedBy" UUID,
    "publishedBy" UUID,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CmsDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CmsRevision" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "changeNote" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CmsRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CmsAsset" (
    "id" UUID NOT NULL,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "defaultAlt" TEXT,
    "focalX" INTEGER NOT NULL DEFAULT 50,
    "focalY" INTEGER NOT NULL DEFAULT 50,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "uploadedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CmsAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CmsDocument_key_key" ON "CmsDocument"("key");
CREATE INDEX "CmsDocument_updatedAt_idx" ON "CmsDocument"("updatedAt");
CREATE UNIQUE INDEX "CmsRevision_documentId_version_key" ON "CmsRevision"("documentId", "version");
CREATE INDEX "CmsRevision_documentId_createdAt_idx" ON "CmsRevision"("documentId", "createdAt");
CREATE UNIQUE INDEX "CmsAsset_storagePath_key" ON "CmsAsset"("storagePath");
CREATE INDEX "CmsAsset_isArchived_createdAt_idx" ON "CmsAsset"("isArchived", "createdAt");

ALTER TABLE "CmsRevision"
ADD CONSTRAINT "CmsRevision_documentId_fkey"
FOREIGN KEY ("documentId") REFERENCES "CmsDocument"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
