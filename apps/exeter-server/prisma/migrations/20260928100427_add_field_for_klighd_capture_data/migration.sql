/*
  Warnings:

  - Added the required column `klighdCapture` to the `experiment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "experiment" ADD COLUMN     "klighdCapture" JSONB NOT NULL;
