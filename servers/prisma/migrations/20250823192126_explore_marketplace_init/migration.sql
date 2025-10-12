/*
  Warnings:

  - You are about to drop the column `saved` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `timeLeft` on the `Item` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_authorId_fkey";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "saved",
DROP COLUMN "timeLeft",
ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "claimedById" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "status" "ItemStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reviews" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserSavedItem" (
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSavedItem_pkey" PRIMARY KEY ("userId","itemId")
);

-- CreateIndex
CREATE INDEX "UserSavedItem_createdAt_idx" ON "UserSavedItem"("createdAt");

-- CreateIndex
CREATE INDEX "Item_createdAt_idx" ON "Item"("createdAt");

-- CreateIndex
CREATE INDEX "Item_bountyUSD_idx" ON "Item"("bountyUSD");

-- CreateIndex
CREATE INDEX "Item_status_idx" ON "Item"("status");

-- CreateIndex
CREATE INDEX "Item_complexity_idx" ON "Item"("complexity");

-- CreateIndex
CREATE INDEX "Item_authorId_idx" ON "Item"("authorId");

-- CreateIndex
CREATE INDEX "Item_claimedById_idx" ON "Item"("claimedById");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSavedItem" ADD CONSTRAINT "UserSavedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSavedItem" ADD CONSTRAINT "UserSavedItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
