-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "raised" REAL NOT NULL,
    "postMoney" REAL NOT NULL,
    "yourCheck" REAL NOT NULL,
    CONSTRAINT "Round_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate existing investments: each becomes a company whose first round is the original check.
-- "raised" is set to the check size; it has no effect on ownership math for a company's first round.
INSERT INTO "Company" ("id", "name", "sector", "createdAt")
SELECT "id", "companyName", "sector", "createdAt" FROM "Investment";

INSERT INTO "Round" ("id", "companyId", "stage", "date", "raised", "postMoney", "yourCheck")
SELECT lower(hex(randomblob(16))), "id", "stage", "investmentDate", "checkSize", "postMoneyValuation", "checkSize"
FROM "Investment";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Investment";
PRAGMA foreign_keys=on;
