"use client";

import { createContext, useContext, useMemo } from "react";
import type { AppSettings } from "@/lib/settings";
import { DEFAULT_SETTINGS } from "@/lib/config";
import { formatCurrency as formatCurrencyBase } from "@/lib/format";

const SettingsContext = createContext<AppSettings>({
  id: 1,
  ...DEFAULT_SETTINGS,
});

export function SettingsProvider({
  settings,
  children,
}: {
  settings: AppSettings;
  children: React.ReactNode;
}) {
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export function useMoney() {
  const { currencySymbol, currencyCode } = useSettings();
  return useMemo(
    () => ({
      currencySymbol,
      currencyCode,
      format: (amount: number | null | undefined) =>
        formatCurrencyBase(amount, currencySymbol),
    }),
    [currencySymbol, currencyCode]
  );
}
