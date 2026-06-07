-- AlterTable : classe/spé/rôle figés sur l'inscription.
ALTER TABLE "EventSignup" ADD COLUMN "role" TEXT;
ALTER TABLE "EventSignup" ADD COLUMN "classId" TEXT;
ALTER TABLE "EventSignup" ADD COLUMN "className" TEXT;
ALTER TABLE "EventSignup" ADD COLUMN "spec" TEXT;

-- CreateTable : main d'un membre par jeu (classe/spé principale réutilisée).
CREATE TABLE "MemberMain" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "specId" TEXT NOT NULL,
    "spec" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberMain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberMain_discordId_gameId_key" ON "MemberMain"("discordId", "gameId");

-- AddForeignKey
ALTER TABLE "MemberMain" ADD CONSTRAINT "MemberMain_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
