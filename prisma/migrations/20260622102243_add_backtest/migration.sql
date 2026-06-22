-- CreateTable
CREATE TABLE "Backtest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "trades" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "winRate" REAL NOT NULL,
    "avgReturnPct" REAL NOT NULL,
    "totalReturnPct" REAL NOT NULL,
    "buyHoldReturnPct" REAL NOT NULL,
    "avgHeldDays" REAL NOT NULL,
    "ranAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Backtest_symbol_key" ON "Backtest"("symbol");
