-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TechnicalSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockId" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "volume" REAL NOT NULL,
    "ema20" REAL NOT NULL,
    "ema50" REAL NOT NULL,
    "ema200" REAL NOT NULL,
    "avgVolume20" REAL NOT NULL,
    "trend" TEXT NOT NULL,
    "reasons" TEXT NOT NULL,
    "holdMinDays" INTEGER NOT NULL DEFAULT 0,
    "holdMaxDays" INTEGER NOT NULL DEFAULT 0,
    "holdConfidence" TEXT NOT NULL DEFAULT 'LOW',
    "exitRule" TEXT NOT NULL DEFAULT '',
    "scannedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TechnicalSnapshot_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TechnicalSnapshot" ("avgVolume20", "ema20", "ema200", "ema50", "id", "price", "reasons", "scannedAt", "stockId", "trend", "volume") SELECT "avgVolume20", "ema20", "ema200", "ema50", "id", "price", "reasons", "scannedAt", "stockId", "trend", "volume" FROM "TechnicalSnapshot";
DROP TABLE "TechnicalSnapshot";
ALTER TABLE "new_TechnicalSnapshot" RENAME TO "TechnicalSnapshot";
CREATE INDEX "TechnicalSnapshot_stockId_scannedAt_idx" ON "TechnicalSnapshot"("stockId", "scannedAt");
CREATE INDEX "TechnicalSnapshot_trend_scannedAt_idx" ON "TechnicalSnapshot"("trend", "scannedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
