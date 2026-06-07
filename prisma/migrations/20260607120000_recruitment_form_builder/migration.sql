-- CreateEnum
CREATE TYPE "RecruitFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'URL', 'NUMBER', 'SELECT');

-- CreateTable
CREATE TABLE "RecruitmentField" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "RecruitFieldType" NOT NULL DEFAULT 'TEXT',
    "placeholder" TEXT,
    "helpText" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "gameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentField_gameId_key_key" ON "RecruitmentField"("gameId", "key");

-- AddForeignKey
ALTER TABLE "RecruitmentField" ADD CONSTRAINT "RecruitmentField_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable : réponses du formulaire personnalisé + colonnes historiques rendues nullable.
ALTER TABLE "Application" ADD COLUMN "answers" JSONB;
ALTER TABLE "Application" ALTER COLUMN "className" DROP NOT NULL;
ALTER TABLE "Application" ALTER COLUMN "role" DROP NOT NULL;
ALTER TABLE "Application" ALTER COLUMN "server" DROP NOT NULL;
ALTER TABLE "Application" ALTER COLUMN "experience" DROP NOT NULL;
ALTER TABLE "Application" ALTER COLUMN "availability" DROP NOT NULL;
ALTER TABLE "Application" ALTER COLUMN "motivation" DROP NOT NULL;
