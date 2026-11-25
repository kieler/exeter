-- AlterTable
ALTER TABLE "batch" ADD COLUMN     "sessionId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "context" JSONB NOT NULL,
    "lastReceivedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "batch" ADD CONSTRAINT "batch_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
