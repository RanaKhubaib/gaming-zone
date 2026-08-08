-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "customerPhone" TEXT;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "subscriptionWarningDays" INTEGER NOT NULL DEFAULT 7,
ALTER COLUMN "liveTimerEnabled" SET DEFAULT true;

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "paidAmount" DOUBLE PRECISION NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);
