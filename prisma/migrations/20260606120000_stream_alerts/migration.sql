-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('FOLLOW', 'SUB', 'RESUB', 'SUBGIFT', 'RAID', 'TEST');

-- CreateTable
CREATE TABLE "StreamAlert" (
    "id" SERIAL NOT NULL,
    "type" "AlertType" NOT NULL,
    "username" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL DEFAULT '',
    "amount" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreamAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StreamAlert_createdAt_idx" ON "StreamAlert"("createdAt");
