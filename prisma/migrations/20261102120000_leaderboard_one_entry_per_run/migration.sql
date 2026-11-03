-- AlterTable
ALTER TABLE "LeaderboardEntry" ADD COLUMN "gameId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_gameId_key" ON "LeaderboardEntry"("gameId");
