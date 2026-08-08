import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SessionsTable, type SessionRow } from "@/components/SessionsTable";
import { api } from "@/lib/api";

export function SessionsPage() {
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [stations, setStations] = useState<{ id: number; name: string }[]>([]);
  const [games, setGames] = useState<{ id: number; name: string }[]>([]);

  const load = useCallback(() => {
    Promise.all([
      api.get<SessionRow[]>("/api/sessions"),
      api.get<{ id: number; name: string }[]>("/api/stations"),
      api.get<{ id: number; name: string }[]>("/api/games"),
    ]).then(([s, st, g]) => {
      setSessions(s);
      setStations(st.map((x) => ({ id: x.id, name: x.name })));
      setGames(g);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const stationId = searchParams.get("stationId");
    const paymentStatus = searchParams.get("paymentStatus");
    return sessions.filter((s) => {
      if (from && s.startTime.slice(0, 10) < from) return false;
      if (to && s.startTime.slice(0, 10) > to) return false;
      if (stationId && String(s.station.id) !== stationId) return false;
      if (paymentStatus && s.paymentStatus !== paymentStatus) return false;
      return true;
    });
  }, [sessions, searchParams]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Sessions
          </h1>
          <p className="mt-1 text-slate-600">History of all play sessions</p>
        </div>
        <a
          href="/api/sessions/export"
          className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white"
        >
          Download CSV
        </a>
      </div>
      <SessionsTable
        sessions={filtered}
        stations={stations}
        games={games}
        onChanged={load}
      />
    </div>
  );
}
