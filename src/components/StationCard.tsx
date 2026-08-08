"use client";

import { useState, useTransition } from "react";
import type { ConsoleType } from "@/lib/constants";
import { Modal } from "./Modal";
import { LiveTimerDisplay } from "./LiveTimerDisplay";
import { createManualSession, startTimerSession } from "@/lib/actions";
import { toLocalInputValue } from "@/lib/format";
import { getDisplayGameName } from "@/lib/session-calc";
import { useMoney } from "@/components/SettingsProvider";

type GameOption = { id: number; name: string };

type ActiveTimerSession = {
  id: number;
  customerName: string;
  customerPhone: string | null;
  startTime: string;
  bookedHours: number | null;
  gameNameFreeText: string | null;
  notes: string | null;
  game: { name: string } | null;
};

type StationCardProps = {
  station: {
    id: number;
    name: string;
    consoleType: ConsoleType;
    hourlyRate: number;
  };
  activeTimer: ActiveTimerSession | null;
  games: GameOption[];
};

export function StationCard({ station, activeTimer, games }: StationCardProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"timer" | "manual">("timer");
  const [bookedHours, setBookedHours] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { format } = useMoney();
  const hasTimer = Boolean(activeTimer);

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("stationId", String(station.id));
    if (mode === "timer") {
      formData.set("bookedHours", String(bookedHours));
    }
    startTransition(async () => {
      const result =
        mode === "timer"
          ? await startTimerSession(formData)
          : await createManualSession(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setBookedHours(1);
      setMode("timer");
    });
  }

  const gameName = activeTimer ? getDisplayGameName(activeTimer) : "—";

  return (
    <>
      <article className="flex flex-col rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{station.name}</h3>
            <p className="text-sm text-slate-500">
              {station.consoleType} · {format(station.hourlyRate)}/hr
            </p>
          </div>
          {hasTimer ? (
            <span
              className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: "var(--occupied)" }}
            >
              Live
            </span>
          ) : (
            <span
              className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: "var(--available)" }}
            >
              Ready
            </span>
          )}
        </div>

        {hasTimer && activeTimer ? (
          <LiveTimerDisplay
            startTime={activeTimer.startTime}
            hourlyRate={station.hourlyRate}
            bookedHours={activeTimer.bookedHours ?? 1}
            sessionId={activeTimer.id}
            customerName={activeTimer.customerName}
            gameName={
              [
                gameName !== "—" ? gameName : null,
                activeTimer.customerPhone,
              ]
                .filter(Boolean)
                .join(" · ") || gameName
            }
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode("timer");
              setBookedHours(1);
              setOpen(true);
            }}
            className="mt-4 w-full rounded-xl bg-[var(--accent)] px-4 py-3.5 text-base font-bold text-white"
          >
            Start a session
          </button>
        )}
      </article>

      <Modal
        open={open}
        title={`Start session — ${station.name}`}
        onClose={() => setOpen(false)}
      >
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("timer")}
              className={`rounded-xl px-3 py-3 text-sm font-bold ${
                mode === "timer"
                  ? "bg-[var(--accent)] text-white"
                  : "border border-slate-300 text-slate-700"
              }`}
            >
              Start timer
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`rounded-xl px-3 py-3 text-sm font-bold ${
                mode === "manual"
                  ? "bg-[var(--accent)] text-white"
                  : "border border-slate-300 text-slate-700"
              }`}
            >
              Add manually
            </button>
          </div>

          <p className="text-xs text-slate-500">
            {mode === "timer"
              ? "Shows a countdown on this station card. When finished, it moves to Sessions."
              : "Saves straight to Sessions history — does not appear on the dashboard."}
          </p>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Customer name *</span>
            <input
              name="customerName"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Phone</span>
            <input
              name="customerPhone"
              type="tel"
              placeholder="03XX-XXXXXXX"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
            />
          </label>

          <GameFields games={games} />

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Notes</span>
            <input
              name="notes"
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
            />
          </label>

          {mode === "timer" ? (
            <div>
              <p className="mb-2 text-sm font-semibold">Hours to assign</p>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setBookedHours(h)}
                    className={`rounded-xl px-2 py-3 text-sm font-bold ${
                      bookedHours === h
                        ? "bg-[var(--accent)] text-white"
                        : "border border-slate-300"
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                Charge: {format(bookedHours * station.hourlyRate)}
              </p>
            </div>
          ) : (
            <>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Start time *</span>
                <input
                  type="datetime-local"
                  name="startTime"
                  required
                  defaultValue={toLocalInputValue(new Date())}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">End time *</span>
                <input
                  type="datetime-local"
                  name="endTime"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" name="paymentStatus" value="PAID" />
                Mark as paid
              </label>
            </>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-3.5 text-base font-bold text-white disabled:opacity-60"
          >
            {pending
              ? "Saving…"
              : mode === "timer"
                ? "Start countdown"
                : "Save to Sessions"}
          </button>
        </form>
      </Modal>
    </>
  );
}

function GameFields({ games }: { games: GameOption[] }) {
  const [gameSelection, setGameSelection] = useState("");
  const showFreeText = gameSelection === "__new__" || gameSelection === "";

  return (
    <>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Game</span>
        <select
          name="gameSelection"
          value={gameSelection}
          onChange={(e) => setGameSelection(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
        >
          <option value="">— Select or type new —</option>
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
          <option value="__new__">+ New game…</option>
        </select>
      </label>
      {showFreeText && (
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Game name</span>
          <input
            name="gameFreeText"
            placeholder="Optional"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
          />
        </label>
      )}
    </>
  );
}
