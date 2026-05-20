-- AlterTable
ALTER TABLE "users" ADD COLUMN     "familyCard" TEXT,
ADD COLUMN     "familyCardUploadedAt" TIMESTAMP(3),
ADD COLUMN     "identityCard" TEXT,
ADD COLUMN     "identityCardUploadedAt" TIMESTAMP(3),
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneVerified" TIMESTAMP(3),
ADD COLUMN     "verificationDate" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;
