-- CreateTable
CREATE TABLE "Model" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);
