/*
  Warnings:

  - Added the required column `renderOptions` to the `experiment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `synthesisOptions` to the `experiment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "experiment" ADD COLUMN     "renderOptions" JSONB NOT NULL,
ADD COLUMN     "synthesisOptions" JSONB NOT NULL;
