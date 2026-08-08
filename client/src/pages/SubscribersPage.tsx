import { useCallback, useEffect, useState } from "react";
import {
  SubscribersManager,
  type SubscriberRow,
} from "@/components/SubscribersManager";
import { api } from "@/lib/api";

export function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [warningDays, setWarningDays] = useState(7);

  const load = useCallback(() => {
    api
      .get<{ subscribers: SubscriberRow[]; warningDays: number }>(
        "/api/subscribers"
      )
      .then((data) => {
        setSubscribers(data.subscribers);
        setWarningDays(data.warningDays);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
      <SubscribersManager subscribers={subscribers} onChanged={load} />
    </div>
  );
}
