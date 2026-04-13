-- AlterTable
ALTER TABLE "Account"
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "lastValidatedAt" TIMESTAMP(3);
