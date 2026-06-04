-- CreateTable
CREATE TABLE "RecruitmentRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "gameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentRole_gameId_name_key" ON "RecruitmentRole"("gameId", "name");

-- AddForeignKey
ALTER TABLE "RecruitmentRole" ADD CONSTRAINT "RecruitmentRole_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Reprise des rôles existants depuis les postes déjà saisis.
INSERT INTO "RecruitmentRole" ("id", "name", "order", "gameId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, d."role", 0, d."gameId", now(), now()
FROM (SELECT DISTINCT "gameId", "role" FROM "RecruitmentSlot") d;
