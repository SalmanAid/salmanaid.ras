-- AlterTable
ALTER TABLE "LoanApplication" ALTER COLUMN "collateralUrl" DROP NOT NULL,
ALTER COLUMN "collateralDescription" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "phone_number" TEXT;
