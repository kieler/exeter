/*
  Warnings:

  - A unique constraint covering the columns `[surveyId,externalParticipantId]` on the table `participant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `surveyId` to the `participant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surveyId` to the `stimulus` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "participant_externalParticipantId_key";

-- AlterTable
ALTER TABLE "participant" ADD COLUMN     "surveyId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "stimulus" ADD COLUMN     "surveyId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "survey" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedAt" TIMESTAMPTZ(3),

    CONSTRAINT "survey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "participant_surveyId_externalParticipantId_key" ON "participant"("surveyId", "externalParticipantId");

-- AddForeignKey
ALTER TABLE "stimulus" ADD CONSTRAINT "stimulus_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant" ADD CONSTRAINT "participant_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
