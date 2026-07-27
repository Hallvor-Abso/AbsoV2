-- Bloc d'intro de la page recrutement : profils recherchés + apports de la guilde.
ALTER TABLE "Game" ADD COLUMN "recruitProfileText" TEXT;
ALTER TABLE "Game" ADD COLUMN "recruitOfferText" TEXT;
