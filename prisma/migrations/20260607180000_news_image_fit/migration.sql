-- AlterTable : mode d'affichage de l'image d'un article ("cover" / "contain").
ALTER TABLE "News" ADD COLUMN "imageFit" TEXT NOT NULL DEFAULT 'cover';
