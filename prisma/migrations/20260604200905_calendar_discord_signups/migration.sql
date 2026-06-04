-- CreateEnum
CREATE TYPE "SignupStatus" AS ENUM ('GOING', 'MAYBE', 'DECLINED');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "discordChannelId" TEXT,
ADD COLUMN     "discordMessageId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "discordId" TEXT;

-- CreateTable
CREATE TABLE "EventSignup" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "SignupStatus" NOT NULL DEFAULT 'GOING',
    "source" TEXT NOT NULL DEFAULT 'discord',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventSignup_eventId_discordId_key" ON "EventSignup"("eventId", "discordId");

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");

-- AddForeignKey
ALTER TABLE "EventSignup" ADD CONSTRAINT "EventSignup_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

