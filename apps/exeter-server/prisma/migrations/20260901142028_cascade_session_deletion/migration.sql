-- DropForeignKey
ALTER TABLE "batch" DROP CONSTRAINT "batch_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_batchId_fkey";

-- AddForeignKey
ALTER TABLE "batch" ADD CONSTRAINT "batch_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
