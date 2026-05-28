-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "installmentFreq" INTEGER NOT NULL DEFAULT 4;

-- AlterTable
ALTER TABLE "LoanApplication" ADD COLUMN     "installmentFreq" INTEGER NOT NULL DEFAULT 4;
