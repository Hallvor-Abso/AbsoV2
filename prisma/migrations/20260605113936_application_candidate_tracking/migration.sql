-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "candidateSeenAt" TIMESTAMP(3),
ADD COLUMN     "lastOfficerMessageAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

