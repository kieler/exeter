/*
  Warnings:

  - A unique constraint covering the columns `[externalParticipantId]` on the table `participant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "participant" ADD COLUMN     "externalParticipantId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "participant_externalParticipantId_key" ON "participant"("externalParticipantId");
