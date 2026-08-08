import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { prisma } from "@/lib/prisma";
import { ReportsCharts } from "@/components/ReportsCharts";
import { getDisplayGameName } from "@/lib/session-calc";

export const dynamic = "force-dynamic";

function summarize(
  sessions: { price: number | null }[]
): { revenue: number; sessions: number } {
  return {
    revenue: sessions.reduce((sum, s) => sum + (s.price ?? 0), 0),
    sessions: sessions.length,
  };
}

export default async function ReportsPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const last30Start = startOfDay(subDays(now, 29));

  const completed = await prisma.session.findMany({
    where: { endTime: { not: null } },
    include: { game: true, station: true },
  });

  const todaySessions = completed.filter(
    (s) => s.startTime >= todayStart && s.startTime <= todayEnd
  );
  const weekSessions = completed.filter(
    (s) => s.startTime >= weekStart && s.startTime <= weekEnd
  );
  const monthSessions = completed.filter(
    (s) => s.startTime >= monthStart && s.startTime <= monthEnd
  );
  const last30 = completed.filter((s) => s.startTime >= last30Start);

  const days = eachDayOfInterval({ start: last30Start, end: todayStart });
  const dailyRevenue = days.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const revenue = last30
      .filter((s) => format(s.startTime, "yyyy-MM-dd") === key)
      .reduce((sum, s) => sum + (s.price ?? 0), 0);
    return {
      date: key,
      label: format(day, "dd MMM"),
      revenue: Math.round(revenue),
    };
  });

  const gameCounts = new Map<string, number>();
  for (const s of completed) {
    const name = getDisplayGameName(s);
    if (name === "—") continue;
    gameCounts.set(name, (gameCounts.get(name) ?? 0) + 1);
  }
  const topGames = [...gameCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const stationMinutes = new Map<string, number>();
  for (const s of completed) {
    const mins = s.durationMinutes ?? 0;
    stationMinutes.set(
      s.station.name,
      (stationMinutes.get(s.station.name) ?? 0) + mins
    );
  }
  const busyStations = [...stationMinutes.entries()]
    .map(([name, minutes]) => ({
      name,
      minutes,
      hours: Math.round((minutes / 60) * 100) / 100,
    }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Reports
        </h1>
        <p className="mt-1 text-slate-600">
          Live totals from completed sessions
        </p>
      </div>
      <ReportsCharts
        summary={{
          today: summarize(todaySessions),
          week: summarize(weekSessions),
          month: summarize(monthSessions),
        }}
        dailyRevenue={dailyRevenue}
        topGames={topGames}
        busyStations={busyStations}
      />
    </div>
  );
}
