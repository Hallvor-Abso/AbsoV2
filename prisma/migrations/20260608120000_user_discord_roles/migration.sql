-- AlterTable
ALTER TABLE "User" ADD COLUMN "discordRoles" TEXT[] DEFAULT ARRAY[]::TEXT[];
