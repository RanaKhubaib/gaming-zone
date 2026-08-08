import { startOfDay, endOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { StationCard } from "@/components/StationCard";
import { formatCurrency } from "@/lib/format";
import { getAppSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const [stations, games, settings, todaySessions, activeTimers] =
    await Promise.all([
      prisma.station.findMany({ orderBy: { id: "asc" } }),
      prisma.game.findMany({ orderBy: { name: "asc" } }),
      getAppSettings(),
      prisma.session.findMany({
        where: {
          startTime: { gte: dayStart, lte: dayEnd },
          endTime: { not: null },
        },
      }),
      // Only live TIMER sessions appear on the dashboard
      prisma.session.findMany({
        where: { endTime: null, entryMode: "TIMER" },
        include: { game: true },
      }),
    ]);

  const todayRevenue = todaySessions.reduce((sum, s) => sum + (s.price ?? 0), 0);
  const todayCount = todaySessions.length;

  const timerByStation = new Map(
    activeTimers.map((s) => [
      s.stationId,
      {
        id: s.id,
        customerName: s.customerName,
        customerPhone: s.customerPhone,
        startTime: s.startTime.toISOString(),
        bookedHours: s.bookedHours,
        gameNameFreeText: s.gameNameFreeText,
        notes: s.notes,
        game: s.game,
      },
    ])
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
              {formatCurrency(todayRevenue, settings.currencySymbol)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Today&apos;s sessions
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{todayCount}</p>
          </div>
        </div>
      </div>

      {stations.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-lg font-semibold text-slate-800">No stations yet</p>
          <p className="mt-1 text-slate-600">
            Add stations on the Stations page to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stations.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              activeTimer={timerByStation.get(station.id) ?? null}
              games={games}
            />
          ))}
        </div>
      )}
    </div>
  );
}
