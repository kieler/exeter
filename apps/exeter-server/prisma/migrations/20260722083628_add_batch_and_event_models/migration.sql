-- CreateTable
CREATE TABLE "batch" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
    "id" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
