import { prisma } from "@/lib/prisma";
import { StationsManager } from "@/components/StationsManager";

export const dynamic = "force-dynamic";

export default async function StationsPage() {
  const stations = await prisma.station.findMany({ orderBy: { id: "asc" } });

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
