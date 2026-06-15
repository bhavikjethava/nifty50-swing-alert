-- CreateTable
CREATE TABLE "Stock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "News" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "summary" TEXT,
    "sentiment" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "News_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TechnicalSnapshot" (
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
    "scannedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TechnicalSnapshot_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockId" INTEGER NOT NULL,
    "signal" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Stock_symbol_key" ON "Stock"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "News_url_key" ON "News"("url");

-- CreateIndex
CREATE INDEX "News_stockId_publishedAt_idx" ON "News"("stockId", "publishedAt");

-- CreateIndex
CREATE INDEX "News_sentiment_publishedAt_idx" ON "News"("sentiment", "publishedAt");

-- CreateIndex
CREATE INDEX "TechnicalSnapshot_stockId_scannedAt_idx" ON "TechnicalSnapshot"("stockId", "scannedAt");

-- CreateIndex
CREATE INDEX "TechnicalSnapshot_trend_scannedAt_idx" ON "TechnicalSnapshot"("trend", "scannedAt");

-- CreateIndex
CREATE INDEX "Alert_stockId_createdAt_idx" ON "Alert"("stockId", "createdAt");

-- CreateIndex
CREATE INDEX "Alert_signal_createdAt_idx" ON "Alert"("signal", "createdAt");
