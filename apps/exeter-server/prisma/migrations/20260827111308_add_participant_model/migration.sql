/*
  Warnings:

  - Added the required column `participantId` to the `session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "session" ADD COLUMN     "participantId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "participant" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "participant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
