/** Fallback defaults when DB settings are missing */
export const DEFAULT_SETTINGS = {
  liveTimerEnabled: true,
  showLiveRunningCost: false,
  minBillableHours: 1,
  roundUpToFullHours: true,
  shopName: "Gaming Zone",
  currencySymbol: "₨",
  currencyCode: "PKR",
  logoUrl: null as string | null,
  accentColor: "#0f766e",
  availableColor: "#059669",
  occupiedColor: "#dc2626",
  unpaidColor: "#d97706",
  paidColor: "#64748b",
  defaultCustomerName: "Walk-in",
  subscriptionWarningDays: 7,
} as const;

/** @deprecated Use getAppSettings() / SettingsProvider — kept for compile-time defaults */
export const APP_CONFIG = {
  currencySymbol: DEFAULT_SETTINGS.currencySymbol,
  currencyCode: DEFAULT_SETTINGS.currencyCode,
  shopName: DEFAULT_SETTINGS.shopName,
} as const;
