-- AlterTable
ALTER TABLE "Boss" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;
