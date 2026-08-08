"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatDuration } from "@/lib/format";
import { useMoney } from "@/components/SettingsProvider";

type DayPoint = { date: string; label: string; revenue: number };
type GameStat = { name: string; count: number };
type StationStat = { name: string; hours: number; minutes: number };

export function ReportsCharts({
  summary,
  dailyRevenue,
  topGames,
  busyStations,
}: {
  summary: {
    today: { revenue: number; sessions: number };
    week: { revenue: number; sessions: number };
    month: { revenue: number; sessions: number };
  };
  dailyRevenue: DayPoint[];
  topGames: GameStat[];
  busyStations: StationStat[];
}) {
  const { format, currencyCode, currencySymbol } = useMoney();

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          title="Today"
          revenue={summary.today.revenue}
          sessions={summary.today.sessions}
          format={format}
        />
        <SummaryCard
          title="This week"
          revenue={summary.week.revenue}
          sessions={summary.week.sessions}
          format={format}
        />
        <SummaryCard
          title="This month"
          revenue={summary.month.revenue}
          sessions={summary.month.sessions}
          format={format}
        />
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Daily revenue (last 30 days)
        </h2>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#64748b" }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                formatter={(value) => [
                  format(Number(value ?? 0)),
                  "Revenue",
                ]}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.date ?? ""
                }
              />
              <Bar dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Top 5 most-played games
          </h2>
          {topGames.length === 0 ? (
            <p className="mt-4 text-slate-500">No completed sessions yet.</p>
          ) : (
            <ol className="mt-4 space-y-2">
              {topGames.map((g, i) => (
                <li
                  key={g.name}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                >
                  <span className="font-semibold text-slate-800">
                    <span className="mr-2 text-slate-400">{i + 1}.</span>
                    {g.name}
                  </span>
                  <span className="text-sm font-bold text-[var(--accent)]">
                    {g.count} sessions
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Busiest stations
          </h2>
          {busyStations.length === 0 ? (
            <p className="mt-4 text-slate-500">No completed sessions yet.</p>
          ) : (
            <ol className="mt-4 space-y-2">
              {busyStations.map((s, i) => (
                <li
                  key={s.name}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                >
                  <span className="font-semibold text-slate-800">
                    <span className="mr-2 text-slate-400">{i + 1}.</span>
                    {s.name}
                  </span>
                  <span className="text-sm font-bold text-[var(--accent)]">
                    {formatDuration(s.minutes)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <p className="text-xs text-slate-500">
        All figures calculated live from the Session table · Currency:{" "}
        {currencyCode} ({currencySymbol})
      </p>
    </div>
  );
}

function SummaryCard({
  title,
  revenue,
  sessions,
  format,
}: {
  title: string;
  revenue: number;
  sessions: number;
  format: (amount: number | null | undefined) => string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold text-[var(--accent)]">
        {format(revenue)}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        {sessions} session{sessions === 1 ? "" : "s"}
      </p>
    </div>
  );
}
