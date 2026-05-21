-- CreateEnum
CREATE TYPE "AccountVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'REVISION_REQUESTED');

-- AlterTable
ALTER TABLE "users"
ADD COLUMN     "institutionCard" TEXT,
ADD COLUMN     "institutionCardUploadedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserRole"
ADD COLUMN     "documentsUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "verificationMessage" TEXT,
ADD COLUMN     "verificationRequestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "verificationStatus" "AccountVerificationStatus" NOT NULL DEFAULT 'PENDING';

-- Admin accounts should not be blocked by identity document review.
UPDATE "UserRole"
SET "verificationStatus" = 'VERIFIED',
    "reviewedAt" = CURRENT_TIMESTAMP
WHERE "roleId" IN (
  SELECT "id"
  FROM "Role"
  WHERE "name" = 'ADMIN'
);
