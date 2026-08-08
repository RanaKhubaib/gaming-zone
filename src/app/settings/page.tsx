import { redirect } from "next/navigation";
import { getAppSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "@/components/SettingsForm";
import { AccountForm } from "@/components/AccountForm";
import { DataBackupPanel } from "@/components/DataBackupPanel";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, user] = await Promise.all([
    getAppSettings(),
    getCurrentUser(),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1 text-slate-600">
          Account, branding, backup, and preferences for {settings.shopName}
        </p>
      </div>

      <AccountForm
        key={`${user.username}-${user.displayName}-${user.updatedAt.toISOString()}`}
        user={user}
      />

      <DataBackupPanel />

      <SettingsForm
        key={`${settings.shopName}-${settings.logoUrl}-${settings.accentColor}`}
        settings={settings}
      />
    </div>
  );
}
