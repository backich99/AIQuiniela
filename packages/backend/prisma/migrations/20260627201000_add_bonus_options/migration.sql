-- AlterTable
ALTER TABLE "BonusQuestion" ADD COLUMN "opensAt" TIMESTAMP(3),
ADD COLUMN "options" TEXT[] DEFAULT ARRAY[]::TEXT[];
