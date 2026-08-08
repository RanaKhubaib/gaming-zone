import { useEffect, useState } from "react";
import { ReportsCharts } from "@/components/ReportsCharts";
import { api } from "@/lib/api";

type ReportsData = {
  today: { revenue: number; sessions: number };
  week: { revenue: number; sessions: number };
  month: { revenue: number; sessions: number };
  dailyRevenue: { date: string; label: string; revenue: number }[];
  topGames: { name: string; count: number }[];
  busyStations: { name: string; hours: number; minutes: number }[];
};

export function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);

  useEffect(() => {
    api.get<ReportsData>("/api/reports").then(setData);
  }, []);

  if (!data) return <p className="text-slate-600">Loading reports…</p>;

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
          today: data.today,
          week: data.week,
          month: data.month,
        }}
        dailyRevenue={data.dailyRevenue}
        topGames={data.topGames}
        busyStations={data.busyStations}
      />
    </div>
  );
}
