-- AlterTable
ALTER TABLE "Event" ADD COLUMN "rosterChannelId" TEXT,
                    ADD COLUMN "rosterMessageId" TEXT;

-- AlterTable
ALTER TABLE "EventSignup" ADD COLUMN "selected" BOOLEAN NOT NULL DEFAULT false;
