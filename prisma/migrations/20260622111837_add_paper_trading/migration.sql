-- CreateTable
CREATE TABLE "PaperAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startingCapital" REAL NOT NULL DEFAULT 50000,
    "cash" REAL NOT NULL DEFAULT 50000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaperPosition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "entryPrice" REAL NOT NULL,
    "entryDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "holdMaxDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "exitPrice" REAL,
    "exitDate" DATETIME,
    "exitReason" TEXT,
    "realizedPnl" REAL
);

-- CreateIndex
CREATE INDEX "PaperPosition_status_symbol_idx" ON "PaperPosition"("status", "symbol");
