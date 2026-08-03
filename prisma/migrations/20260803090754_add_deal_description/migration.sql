-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "raised" REAL NOT NULL,
    "postMoney" REAL NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "signals" TEXT NOT NULL,
    "quality" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open'
);
INSERT INTO "new_Deal" ("id", "name", "postMoney", "quality", "raised", "sector", "signals", "stage", "status", "year") SELECT "id", "name", "postMoney", "quality", "raised", "sector", "signals", "stage", "status", "year" FROM "Deal";
DROP TABLE "Deal";
ALTER TABLE "new_Deal" RENAME TO "Deal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
