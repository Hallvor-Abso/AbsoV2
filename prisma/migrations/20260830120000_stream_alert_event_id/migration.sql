-- Déduplication des notifications Twitch EventSub : une même notification
-- rejouée par Twitch ne doit pas créer plusieurs alertes.
ALTER TABLE "StreamAlert" ADD COLUMN "eventId" TEXT;
CREATE UNIQUE INDEX "StreamAlert_eventId_key" ON "StreamAlert"("eventId");
