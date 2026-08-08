import { useRef, useState, useTransition } from "react";
import type { AppSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/config";
import {
  updateAppSettings,
  uploadLogo,
  removeLogo,
} from "@/lib/actions";

export function SettingsForm({
  settings,
  onSaved,
}: {
  settings: AppSettings;
  onSaved?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [logoPending, startLogoTransition] = useTransition();
  const [colorResetKey, setColorResetKey] = useState(0);
  const [colorDefaults, setColorDefaults] = useState({
    accentColor: settings.accentColor,
    availableColor: settings.availableColor,
    occupiedColor: settings.occupiedColor,
    unpaidColor: settings.unpaidColor,
    paidColor: settings.paidColor,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSave(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateAppSettings(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage("Settings saved.");
      onSaved?.();
    });
  }

  function handleLogoUpload(formData: FormData) {
    setError(null);
    setMessage(null);
    startLogoTransition(async () => {
      const result = await uploadLogo(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage("Logo updated.");
      onSaved?.();
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  function handleRemoveLogo() {
    if (!confirm("Remove the current logo?")) return;
    setError(null);
    setMessage(null);
    startLogoTransition(async () => {
      await removeLogo();
      setMessage("Logo removed.");
      onSaved?.();
    });
  }

  function resetColors() {
    setColorDefaults({
      accentColor: DEFAULT_SETTINGS.accentColor,
      availableColor: DEFAULT_SETTINGS.availableColor,
      occupiedColor: DEFAULT_SETTINGS.occupiedColor,
      unpaidColor: DEFAULT_SETTINGS.unpaidColor,
      paidColor: DEFAULT_SETTINGS.paidColor,
    });
    setColorResetKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      {(error || message) && (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            error
              ? "bg-red-50 text-red-700"
              : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {error || message}
        </p>
      )}

      {/* Logo */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">Logo</h2>
        <p className="mt-1 text-sm text-slate-600">
          Shown in the top navigation and as the browser tab icon. PNG, JPG,
          WEBP, GIF, or SVG — max 2 MB. Stored in the database (works on Vercel).
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logoUrl}
                alt="Shop logo"
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <span className="text-xs font-semibold text-slate-400">No logo</span>
            )}
          </div>
          <form action={handleLogoUpload} className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <input
              ref={fileRef}
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold file:text-slate-700"
            />
            <button
              type="submit"
              disabled={logoPending}
              className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {logoPending ? "Uploading…" : "Upload"}
            </button>
            {settings.logoUrl && (
              <button
                type="button"
                disabled={logoPending}
                onClick={handleRemoveLogo}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Remove
              </button>
            )}
          </form>
        </div>
      </section>

      <form action={handleSave} className="space-y-6">
        {/* Shop & currency */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Shop & currency</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-slate-700">
                Shop name *
              </span>
              <input
                name="shopName"
                required
                defaultValue={settings.shopName}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_25%,transparent)]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">
                Currency symbol *
              </span>
              <input
                name="currencySymbol"
                required
                defaultValue={settings.currencySymbol}
                placeholder="₨"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">
                Currency code *
              </span>
              <input
                name="currencyCode"
                required
                defaultValue={settings.currencyCode}
                placeholder="PKR"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-slate-700">
                Default customer name (timer sessions)
              </span>
              <input
                name="defaultCustomerName"
                defaultValue={settings.defaultCustomerName}
                placeholder="Walk-in"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
              />
            </label>
          </div>
        </section>

        {/* Colors */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Colors</h2>
              <p className="mt-1 text-sm text-slate-600">
                Accent buttons, available / occupied stations, paid / unpaid badges.
              </p>
            </div>
            <button
              type="button"
              onClick={resetColors}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset to defaults
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ColorField
              key={`accent-${colorResetKey}`}
              name="accentColor"
              label="Accent"
              defaultValue={colorDefaults.accentColor}
            />
            <ColorField
              key={`available-${colorResetKey}`}
              name="availableColor"
              label="Available"
              defaultValue={colorDefaults.availableColor}
            />
            <ColorField
              key={`occupied-${colorResetKey}`}
              name="occupiedColor"
              label="Occupied"
              defaultValue={colorDefaults.occupiedColor}
            />
            <ColorField
              key={`unpaid-${colorResetKey}`}
              name="unpaidColor"
              label="Unpaid"
              defaultValue={colorDefaults.unpaidColor}
            />
            <ColorField
              key={`paid-${colorResetKey}`}
              name="paidColor"
              label="Paid"
              defaultValue={colorDefaults.paidColor}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <PreviewChip label="Available" colorVar="--available" />
            <PreviewChip label="Occupied" colorVar="--occupied" />
            <PreviewChip label="Unpaid" colorVar="--unpaid" />
            <PreviewChip label="Paid" colorVar="--paid" />
            <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-white">
              Accent button
            </span>
          </div>
        </section>

        {/* Timer & pricing */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Timer &amp; pricing</h2>
          <p className="mt-1 text-sm text-slate-600">
            Per-hour rates are set on each station (Stations page). These rules
            control the minimum charge and how the live timer displays price.
          </p>

          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="liveTimerEnabled"
              defaultChecked={settings.liveTimerEnabled}
              className="mt-1 h-5 w-5 rounded border-slate-300"
            />
            <span>
              <span className="block font-semibold text-slate-900">
                Enable live Start/Stop timer
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                When off, add sessions manually with your own start/end time. When
                on, stations also get a live Start/Stop timer button.
              </span>
            </span>
          </label>

          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="showLiveRunningCost"
              defaultChecked={settings.showLiveRunningCost}
              className="mt-1 h-5 w-5 rounded border-slate-300"
            />
            <span>
              <span className="block font-semibold text-slate-900">
                Show live running price on timer
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                Off by default. When off, the timer shows play time and the hourly
                rate / minimum charge. When on, price ticks up as time passes.
              </span>
            </span>
          </label>

          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">
              Minimum billable hours
            </span>
            <input
              name="minBillableHours"
              type="number"
              min="0"
              step="0.5"
              required
              defaultValue={settings.minBillableHours}
              className="w-full max-w-xs rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Default 1 = charge at least one hour at the station rate (e.g. ₨300
              if the station is ₨300/hr), even for short sessions.
            </span>
          </label>

          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="roundUpToFullHours"
              defaultChecked={settings.roundUpToFullHours}
              className="mt-1 h-5 w-5 rounded border-slate-300"
            />
            <span>
              <span className="block font-semibold text-slate-900">
                Round up to full hours
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                On by default. Example: 1h 05m → 2 hours × rate. Turn off to
                charge by exact minutes after the minimum is met.
              </span>
            </span>
          </label>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">
              Subscription warning (days before end)
            </span>
            <input
              name="subscriptionWarningDays"
              type="number"
              min="1"
              required
              defaultValue={settings.subscriptionWarningDays}
              className="w-full max-w-xs rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Subscribers within this many days of ending (or already expired)
              show in red on the Subscribers page.
            </span>
          </label>
        </section>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-[var(--accent)] px-4 py-3.5 text-base font-bold text-white disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
      </form>

    </div>
  );
}

function ColorField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <label className="block rounded-xl bg-slate-50 p-3">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-11 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
        />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(v)) setValue(v);
          }}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
        />
      </div>
    </label>
  );
}

function PreviewChip({
  label,
  colorVar,
}: {
  label: string;
  colorVar: string;
}) {
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-bold text-white"
      style={{ backgroundColor: `var(${colorVar})` }}
    >
      {label}
    </span>
  );
}
