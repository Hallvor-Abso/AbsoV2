-- AlterTable : marqueurs d'envoi des rappels de raid (MP).
ALTER TABLE "Event" ADD COLUMN "reminder24hSentAt" TIMESTAMP(3);
ALTER TABLE "Event" ADD COLUMN "reminder1hSentAt" TIMESTAMP(3);
