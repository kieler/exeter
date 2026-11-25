-- AlterTable
ALTER TABLE "event"
ADD COLUMN     "occurredAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "sequence" INTEGER NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;
