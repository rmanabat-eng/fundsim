-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitValue" REAL,
    "exitDate" DATETIME,
    "quality" REAL NOT NULL DEFAULT 0,
    "dealId" TEXT,
    CONSTRAINT "Company_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Company" ("createdAt", "exitDate", "exitValue", "id", "name", "quality", "sector") SELECT "createdAt", "exitDate", "exitValue", "id", "name", "quality", "sector" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_dealId_key" ON "Company"("dealId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
