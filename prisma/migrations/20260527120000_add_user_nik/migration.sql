-- AlterTable
ALTER TABLE "users" ADD COLUMN "nik" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_nik_key" ON "users"("nik");
