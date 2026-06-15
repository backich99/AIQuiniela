/*
  Warnings:

  - A unique constraint covering the columns `[espnEventId]` on the table `Match` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "MatchPhase" ADD VALUE 'R32';

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "espnEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Match_espnEventId_key" ON "Match"("espnEventId");
