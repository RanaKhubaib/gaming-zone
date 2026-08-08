import { useCallback, useEffect, useState } from "react";
import { SettingsForm } from "@/components/SettingsForm";
import { AccountForm } from "@/components/AccountForm";
import { DataBackupPanel } from "@/components/DataBackupPanel";
import { api } from "@/lib/api";
import type { AppSettings, AuthUser } from "@/lib/types";

export function SettingsPage({
  user,
  onSettingsSaved,
}: {
  user: AuthUser;
  onSettingsSaved?: () => void;
}) {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const load = useCallback(() => {
    api.get<AppSettings>("/api/settings").then(setSettings);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!settings) return <p className="text-slate-600">Loading settings…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1 text-slate-600">
          Branding, pricing, account, and backups
        </p>
      </div>
      <SettingsForm
        settings={settings}
        onSaved={() => {
          load();
          onSettingsSaved?.();
        }}
      />
      <AccountForm user={user} />
      <DataBackupPanel />
    </div>
  );
}
