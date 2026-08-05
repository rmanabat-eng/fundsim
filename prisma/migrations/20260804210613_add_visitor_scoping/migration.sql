-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "visitorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "visitorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Decision" ADD COLUMN     "visitorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FundSettings" DROP CONSTRAINT "FundSettings_pkey",
ADD COLUMN     "visitorId" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "FundSettings_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Game" DROP CONSTRAINT "Game_pkey",
ADD COLUMN     "visitorId" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Game_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "visitorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Scenario" ADD COLUMN     "visitorId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Company_visitorId_idx" ON "Company"("visitorId");

-- CreateIndex
CREATE INDEX "Deal_visitorId_idx" ON "Deal"("visitorId");

-- CreateIndex
CREATE INDEX "Decision_visitorId_idx" ON "Decision"("visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "FundSettings_visitorId_key" ON "FundSettings"("visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_visitorId_key" ON "Game"("visitorId");

-- CreateIndex
CREATE INDEX "Round_visitorId_idx" ON "Round"("visitorId");

-- CreateIndex
CREATE INDEX "Scenario_visitorId_idx" ON "Scenario"("visitorId");

