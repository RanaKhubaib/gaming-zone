-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "liveTimerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "shopName" TEXT NOT NULL DEFAULT 'Gaming Zone',
    "currencySymbol" TEXT NOT NULL DEFAULT '₨',
    "currencyCode" TEXT NOT NULL DEFAULT 'PKR',
    "logoUrl" TEXT,
    "accentColor" TEXT NOT NULL DEFAULT '#0f766e',
    "availableColor" TEXT NOT NULL DEFAULT '#059669',
    "occupiedColor" TEXT NOT NULL DEFAULT '#dc2626',
    "unpaidColor" TEXT NOT NULL DEFAULT '#d97706',
    "paidColor" TEXT NOT NULL DEFAULT '#64748b',
    "defaultCustomerName" TEXT NOT NULL DEFAULT 'Walk-in'
);
INSERT INTO "new_Settings" ("id", "liveTimerEnabled") SELECT "id", "liveTimerEnabled" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
