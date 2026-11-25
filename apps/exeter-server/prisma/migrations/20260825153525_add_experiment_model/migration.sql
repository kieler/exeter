/*
  Warnings:

  - You are about to drop the `Model` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `experimentId` to the `session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "session" ADD COLUMN     "experimentId" UUID NOT NULL;

-- DropTable
DROP TABLE "Model";

-- CreateTable
CREATE TABLE "model" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedAt" TIMESTAMPTZ(3),

    CONSTRAINT "model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "modelId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedAt" TIMESTAMPTZ(3),

    CONSTRAINT "experiment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment" ADD CONSTRAINT "experiment_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
