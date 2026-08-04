-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C');

-- CreateTable
CREATE TABLE "FundSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "fundSize" DOUBLE PRECISION NOT NULL DEFAULT 10000000,
    "maxCompanies" INTEGER NOT NULL DEFAULT 15,

    CONSTRAINT "FundSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" TEXT NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "referredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitValue" DOUBLE PRECISION,
    "exitDate" TIMESTAMP(3),
    "quality" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scenarioState" TEXT NOT NULL DEFAULT '{}',
    "dealId" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "year" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "market" TEXT NOT NULL DEFAULT 'normal',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "stage" "Stage" NOT NULL,
    "raised" DOUBLE PRECISION NOT NULL,
    "postMoney" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "referredBy" TEXT,
    "signals" TEXT NOT NULL,
    "quality" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stage" "Stage" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "raised" DOUBLE PRECISION NOT NULL,
    "postMoney" DOUBLE PRECISION NOT NULL,
    "yourCheck" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_dealId_key" ON "Company"("dealId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
