/*
  Warnings:

  - You are about to drop the column `experimentId` on the `session` table. All the data in the column will be lost.
  - You are about to drop the `experiment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `stimulusId` to the `session` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "experiment" DROP CONSTRAINT "experiment_modelId_fkey";

-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_experimentId_fkey";

-- AlterTable
ALTER TABLE "session" DROP COLUMN "experimentId",
ADD COLUMN     "stimulusId" UUID NOT NULL;

-- DropTable
DROP TABLE "experiment";

-- CreateTable
CREATE TABLE "stimulus" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "modelId" UUID NOT NULL,
    "klighdCapture" JSONB NOT NULL,
    "renderOptions" JSONB NOT NULL,
    "synthesisOptions" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedAt" TIMESTAMPTZ(3),

    CONSTRAINT "stimulus_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_stimulusId_fkey" FOREIGN KEY ("stimulusId") REFERENCES "stimulus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stimulus" ADD CONSTRAINT "stimulus_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
