import { useEffect, useState, useTransition } from "react";
import {
  formatCountdown,
  formatOvertime,
  getCountdownRemainingMs,
  priceFromBookedHours,
} from "@/lib/session-calc";
import { useMoney, useSettings } from "@/components/SettingsProvider";
import {
  extendTimerHour,
  stopTimerSession,
} from "@/lib/actions";

type LiveTimerProps = {
  startTime: string;
  hourlyRate: number;
  bookedHours: number;
  sessionId: number;
  customerName: string;
  gameName: string;
  onChanged?: () => void;
};

export function LiveTimerDisplay({
  startTime,
  hourlyRate,
  bookedHours,
  sessionId,
  customerName,
  gameName,
  onChanged,
}: LiveTimerProps) {
  const [now, setNow] = useState(() => new Date());
  const [pending, startTransition] = useTransition();
  const { format } = useMoney();
  const { showLiveRunningCost } = useSettings();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const remainingMs = getCountdownRemainingMs(
    new Date(startTime),
    bookedHours,
    now
  );
  const overtime = remainingMs <= 0;
  const bookedPrice = priceFromBookedHours(bookedHours, hourlyRate);

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      const result = (await action()) as { error?: string } | undefined;
      if (result?.error) {
        alert(result.error);
        return;
      }
      onChanged?.();
    });
  }

  return (
    <div
      className="mt-3 space-y-3 rounded-xl p-3"
      style={{
        backgroundColor: overtime
          ? "color-mix(in srgb, var(--unpaid) 20%, white)"
          : "color-mix(in srgb, var(--occupied) 14%, white)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {overtime ? "Time over" : "Time left"}
          </p>
          <span
            className="font-mono text-3xl font-bold tabular-nums"
            style={{ color: overtime ? "var(--unpaid)" : "var(--occupied)" }}
          >
            {overtime
              ? formatOvertime(remainingMs)
              : formatCountdown(remainingMs)}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500">
            {bookedHours}h booked
          </p>
          <p
            className="text-lg font-bold"
            style={{ color: overtime ? "var(--unpaid)" : "var(--occupied)" }}
          >
            {format(bookedPrice)}
          </p>
          {showLiveRunningCost && (
            <p className="text-xs text-slate-500">{format(hourlyRate)}/hr</p>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-700">
        <span className="font-semibold">{customerName}</span>
        {gameName !== "—" ? ` · ${gameName}` : ""}
      </p>

      {overtime ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Booked time finished. Add another hour, or finish and keep the
            current charge (ignore a few extra minutes).
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => extendTimerHour(sessionId))}
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-base font-bold text-white disabled:opacity-60"
          >
            {pending
              ? "Updating…"
              : `Assign another hour (+${format(hourlyRate)})`}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(() => stopTimerSession(sessionId, { ignoreOvertime: true }))
            }
            className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-base font-bold text-slate-800 disabled:opacity-60"
          >
            Ignore overtime — keep {bookedHours}h ({format(bookedPrice)})
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => stopTimerSession(sessionId))}
          className="w-full rounded-xl px-4 py-3 text-base font-bold text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--occupied)" }}
        >
          {pending ? "Stopping…" : "Stop early"}
        </button>
      )}
    </div>
  );
}
