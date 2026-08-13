-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "fundName" TEXT NOT NULL,
    "tvpi" DOUBLE PRECISION NOT NULL,
    "reputation" DOUBLE PRECISION NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaderboardEntry_visitorId_idx" ON "LeaderboardEntry"("visitorId");
