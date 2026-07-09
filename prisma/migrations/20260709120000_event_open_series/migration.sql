-- Série récurrente « sans fin » : génération des occurrences au fil de l'eau.
ALTER TABLE "Event" ADD COLUMN "seriesOpen" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "recurrence" TEXT;
ALTER TABLE "Event" ADD COLUMN "publishWeekday" INTEGER;
ALTER TABLE "Event" ADD COLUMN "publishHour" INTEGER;
ALTER TABLE "Event" ADD COLUMN "publishMinute" INTEGER;
