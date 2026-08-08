import { prisma } from "./prisma";
import { DEFAULT_SETTINGS } from "./config";
import type { PricingOptions } from "./session-calc";

export type AppSettings = {
  id: number;
  liveTimerEnabled: boolean;
  showLiveRunningCost: boolean;
  minBillableHours: number;
  roundUpToFullHours: boolean;
  shopName: string;
  currencySymbol: string;
  currencyCode: string;
  logoUrl: string | null;
  accentColor: string;
  availableColor: string;
  occupiedColor: string;
  unpaidColor: string;
  paidColor: string;
  defaultCustomerName: string;
  subscriptionWarningDays: number;
};

export async function getAppSettings(): Promise<AppSettings> {
  const row = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      liveTimerEnabled: DEFAULT_SETTINGS.liveTimerEnabled,
      showLiveRunningCost: DEFAULT_SETTINGS.showLiveRunningCost,
      minBillableHours: DEFAULT_SETTINGS.minBillableHours,
      roundUpToFullHours: DEFAULT_SETTINGS.roundUpToFullHours,
      shopName: DEFAULT_SETTINGS.shopName,
      currencySymbol: DEFAULT_SETTINGS.currencySymbol,
      currencyCode: DEFAULT_SETTINGS.currencyCode,
      accentColor: DEFAULT_SETTINGS.accentColor,
      availableColor: DEFAULT_SETTINGS.availableColor,
      occupiedColor: DEFAULT_SETTINGS.occupiedColor,
      unpaidColor: DEFAULT_SETTINGS.unpaidColor,
      paidColor: DEFAULT_SETTINGS.paidColor,
      defaultCustomerName: DEFAULT_SETTINGS.defaultCustomerName,
      subscriptionWarningDays: DEFAULT_SETTINGS.subscriptionWarningDays,
    },
  });

  return {
    id: row.id,
    liveTimerEnabled: row.liveTimerEnabled,
    showLiveRunningCost: row.showLiveRunningCost,
    minBillableHours: row.minBillableHours,
    roundUpToFullHours: row.roundUpToFullHours,
    shopName: row.shopName,
    currencySymbol: row.currencySymbol,
    currencyCode: row.currencyCode,
    logoUrl: row.logoUrl,
    accentColor: row.accentColor,
    availableColor: row.availableColor,
    occupiedColor: row.occupiedColor,
    unpaidColor: row.unpaidColor,
    paidColor: row.paidColor,
    defaultCustomerName: row.defaultCustomerName,
    subscriptionWarningDays: row.subscriptionWarningDays,
  };
}

export function settingsToPricingOptions(settings: {
  minBillableHours: number;
  roundUpToFullHours: boolean;
}): PricingOptions {
  return {
    minBillableHours: settings.minBillableHours,
    roundUpToFullHours: settings.roundUpToFullHours,
  };
}

export function settingsToCssVars(settings: AppSettings): Record<string, string> {
  return {
    "--accent": settings.accentColor,
    "--available": settings.availableColor,
    "--occupied": settings.occupiedColor,
    "--unpaid": settings.unpaidColor,
    "--paid": settings.paidColor,
  };
}
