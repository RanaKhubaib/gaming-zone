import { useCallback, useEffect, useState } from "react";
import { StationCard } from "@/components/StationCard";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { ConsoleType } from "@/lib/constants";
import { useSettings } from "@/components/SettingsProvider";

type DashboardData = {
  stations: {
    id: number;
    name: string;
    consoleType: string;
    hourlyRate: number;
  }[];
  games: { id: number; name: string }[];
  todayRevenue: number;
  todayCount: number;
  activeTimers: {
    id: number;
    stationId: number;
    customerName: string;
    customerPhone: string | null;
    startTime: string;
    bookedHours: number | null;
    gameNameFreeText: string | null;
    notes: string | null;
    game: { name: string } | null;
  }[];
};

export function DashboardPage() {
  const settings = useSettings();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .get<DashboardData>("/api/dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }
  if (!data) {
    return <p className="text-slate-600">Loading dashboard…</p>;
  }

  const timerByStation = new Map(
    data.activeTimers.map((t) => [t.stationId, t])
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-slate-600">
            Start a session on any station · live timers show here · manual
            entries go to Sessions
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Today&apos;s revenue
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--accent)]">
              {formatCurrency(data.todayRevenue, settings.currencySymbol)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Today&apos;s sessions
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {data.todayCount}
            </p>
          </div>
        </div>
      </div>

      {data.stations.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-lg font-semibold text-slate-800">No stations yet</p>
          <p className="mt-1 text-slate-600">
            Add stations on the Stations page to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.stations.map((station) => (
            <StationCard
              key={station.id}
              station={{
                ...station,
                consoleType: station.consoleType as ConsoleType,
              }}
              activeTimer={timerByStation.get(station.id) ?? null}
              games={data.games}
              onChanged={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
