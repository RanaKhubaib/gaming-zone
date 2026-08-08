import { differenceInCalendarDays, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getAppSettings } from "@/lib/settings";
import { SubscribersManager } from "@/components/SubscribersManager";

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  const [settings, rows] = await Promise.all([
    getAppSettings(),
    prisma.subscriber.findMany({ orderBy: { endDate: "asc" } }),
  ]);

  const today = startOfDay(new Date());
  const warningDays = settings.subscriptionWarningDays;

  const subscribers = rows.map((s) => {
    const daysLeft = differenceInCalendarDays(startOfDay(s.endDate), today);
    let status: "active" | "warning" | "expired" = "active";
    if (daysLeft < 0) status = "expired";
    else if (daysLeft <= warningDays) status = "warning";

    return {
      id: s.id,
      name: s.name,
      phone: s.phone,
      address: s.address,
      paidAmount: s.paidAmount,
      durationDays: s.durationDays,
      startDate: s.startDate.toISOString(),
      endDate: s.endDate.toISOString(),
      notes: s.notes,
      daysLeft,
      status,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Subscribers
        </h1>
        <p className="mt-1 text-slate-600">
          Long-term members · rows turn red when {warningDays} days or less
          remain (or expired)
        </p>
      </div>
      <SubscribersManager subscribers={subscribers} />
    </div>
  );
}
