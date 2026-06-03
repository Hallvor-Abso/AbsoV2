-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VISITEUR', 'MEMBRE', 'ADMIN', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "discord" TEXT,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'VISITEUR',
ALTER COLUMN "username" DROP NOT NULL;

-- CreateTable
CREATE TABLE "_GameAdmins" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_GameAdmins_AB_unique" ON "_GameAdmins"("A", "B");

-- CreateIndex
CREATE INDEX "_GameAdmins_B_index" ON "_GameAdmins"("B");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "_GameAdmins" ADD CONSTRAINT "_GameAdmins_A_fkey" FOREIGN KEY ("A") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameAdmins" ADD CONSTRAINT "_GameAdmins_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Promotion des comptes existants (uniquement des admins à ce stade) en Super Admin.
UPDATE "User" SET "role" = 'SUPER_ADMIN';
