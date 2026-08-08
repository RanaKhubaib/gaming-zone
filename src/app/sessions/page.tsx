import { Suspense } from "react";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SessionsTable } from "@/components/SessionsTable";
import { PaymentStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  from?: string;
  to?: string;
  stationId?: string;
  paymentStatus?: string;
}>;

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const where: Prisma.SessionWhereInput = {};

  if (params.from || params.to) {
    where.startTime = {};
    if (params.from) {
      where.startTime.gte = startOfDay(parseISO(params.from));
    }
    if (params.to) {
      where.startTime.lte = endOfDay(parseISO(params.to));
    }
  }

  if (params.stationId) {
    where.stationId = Number(params.stationId);
  }

  if (
    params.paymentStatus === PaymentStatus.PAID ||
    params.paymentStatus === PaymentStatus.UNPAID
  ) {
    where.paymentStatus = params.paymentStatus;
  }

  const [sessions, stations, games] = await Promise.all([
    prisma.session.findMany({
      where,
      include: { station: true, game: true },
      orderBy: { startTime: "desc" },
    }),
    prisma.station.findMany({ orderBy: { name: "asc" } }),
    prisma.game.findMany({ orderBy: { name: "asc" } }),
  ]);

  const rows = sessions.map((s) => ({
    id: s.id,
    customerName: s.customerName,
    customerPhone: s.customerPhone,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime ? s.endTime.toISOString() : null,
    durationMinutes: s.durationMinutes,
    price: s.price,
    paymentStatus: s.paymentStatus as "PAID" | "UNPAID",
    notes: s.notes,
    gameId: s.gameId,
    gameNameFreeText: s.gameNameFreeText,
    game: s.game,
    station: { id: s.station.id, name: s.station.name },
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Sessions
          </h1>
          <p className="mt-1 text-slate-600">
            History, payments, and editing — duration and price recalculate
            automatically
          </p>
        </div>
        <a
          href="/api/sessions/export"
          className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white"
        >
          Download CSV
        </a>
      </div>
      <Suspense fallback={<p className="text-slate-500">Loading sessions…</p>}>
        <SessionsTable
          sessions={rows}
          stations={stations.map((s) => ({ id: s.id, name: s.name }))}
          games={games}
        />
      </Suspense>
    </div>
  );
}
