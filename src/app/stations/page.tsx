import { prisma } from "@/lib/prisma";
import { StationsManager } from "@/components/StationsManager";
import type { ConsoleType, StationStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function StationsPage() {
  const rows = await prisma.station.findMany({ orderBy: { id: "asc" } });
  const stations = rows.map((s) => ({
    ...s,
    consoleType: s.consoleType as ConsoleType,
    status: s.status as StationStatus,
  }));

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
      <StationsManager stations={stations} />
    </div>
  );
}
