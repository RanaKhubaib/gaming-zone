-- CreateTable
CREATE TABLE "Station" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "consoleType" TEXT NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "stationId" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "gameId" INTEGER,
    "gameNameFreeText" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationMinutes" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "entryMode" TEXT NOT NULL DEFAULT 'MANUAL',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "liveTimerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "showLiveRunningCost" BOOLEAN NOT NULL DEFAULT false,
    "minBillableHours" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "roundUpToFullHours" BOOLEAN NOT NULL DEFAULT true,
    "shopName" TEXT NOT NULL DEFAULT 'Gaming Zone',
    "currencySymbol" TEXT NOT NULL DEFAULT '₨',
    "currencyCode" TEXT NOT NULL DEFAULT 'PKR',
    "logoUrl" TEXT,
    "accentColor" TEXT NOT NULL DEFAULT '#0f766e',
    "availableColor" TEXT NOT NULL DEFAULT '#059669',
    "occupiedColor" TEXT NOT NULL DEFAULT '#dc2626',
    "unpaidColor" TEXT NOT NULL DEFAULT '#d97706',
    "paidColor" TEXT NOT NULL DEFAULT '#64748b',
    "defaultCustomerName" TEXT NOT NULL DEFAULT 'Walk-in',

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_name_key" ON "Game"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
