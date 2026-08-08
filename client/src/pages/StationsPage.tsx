import { useCallback, useEffect, useState } from "react";
import { StationsManager } from "@/components/StationsManager";
import { api } from "@/lib/api";
import type { ConsoleType, StationStatus } from "@/lib/constants";

type Station = {
  id: number;
  name: string;
  consoleType: ConsoleType;
  hourlyRate: number;
  status: StationStatus;
};

export function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const load = useCallback(() => {
    api.get<Station[]>("/api/stations").then((rows) =>
      setStations(
        rows.map((s) => ({
          ...s,
          consoleType: s.consoleType as ConsoleType,
          status: s.status as StationStatus,
        }))
      )
    );
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Stations
        </h1>
        <p className="mt-1 text-slate-600">
          Manage consoles, names, and hourly rates
        </p>
      </div>
      <StationsManager stations={stations} onChanged={load} />
    </div>
  );
}
