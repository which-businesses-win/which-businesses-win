-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "score" INTEGER NOT NULL,
    "confidence" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "firstSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "gdv" REAL NOT NULL DEFAULT 1,
    "location" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "baseIRR" REAL NOT NULL,
    "stressedIRR" REAL NOT NULL,
    "planningRisk" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "evaluation" TEXT,
    "units" INTEGER,
    "avgUnitSize" REAL,
    "siteArea" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SignalSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "refusalRate" REAL NOT NULL,
    "nearbyCount" INTEGER NOT NULL,
    "drivers" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SignalSnapshot_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Outcome" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "actualIRR" REAL,
    "notes" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Outcome_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RawArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RawSignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "sentiment" REAL NOT NULL,
    "strength" REAL NOT NULL,
    "sectors" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "locationName" TEXT,
    "locationType" TEXT,
    "articleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GeoScoreSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectorId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "bucketDate" DATETIME NOT NULL,
    "score" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SourcedDeal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "gdv" REAL NOT NULL,
    "units" INTEGER,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "estimatedIRR" REAL NOT NULL DEFAULT 15,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MarketSectorSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectorId" TEXT NOT NULL,
    "bucketDate" DATETIME NOT NULL,
    "scoresJson" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "SignalSnapshot_dealId_key" ON "SignalSnapshot"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "Outcome_dealId_key" ON "Outcome"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "RawArticle_dedupeKey_key" ON "RawArticle"("dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "GeoScoreSnapshot_sectorId_location_bucketDate_key" ON "GeoScoreSnapshot"("sectorId", "location", "bucketDate");

-- CreateIndex
CREATE UNIQUE INDEX "MarketSectorSnapshot_sectorId_bucketDate_key" ON "MarketSectorSnapshot"("sectorId", "bucketDate");
