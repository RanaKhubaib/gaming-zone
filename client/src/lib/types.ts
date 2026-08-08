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

export type AuthUser = {
  id: number;
  username: string;
  displayName: string;
};
