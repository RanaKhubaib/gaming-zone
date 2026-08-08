import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import {
  createSubscriber,
  updateSubscriber,
  deleteSubscriber,
} from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { useMoney } from "@/components/SettingsProvider";

export type SubscriberRow = {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  paidAmount: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  notes: string | null;
  daysLeft: number;
  status: "active" | "warning" | "expired";
};

export function SubscribersManager({
  subscribers,
  onChanged,
}: {
  subscribers: SubscriberRow[];
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriberRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { format } = useMoney();

  function openCreate() {
    setEditing(null);
    setError(null);
    setOpen(true);
  }

  function openEdit(row: SubscriberRow) {
    setEditing(row);
    setError(null);
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = editing
        ? await updateSubscriber(formData)
        : await createSubscriber(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      onChanged?.();
    });
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`Delete subscriber "${name}"?`)) return;
    startTransition(async () => {
      await deleteSubscriber(id);
      onChanged?.();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-[var(--accent)] px-5 py-3 text-base font-bold text-white"
        >
          Add subscriber
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Address</th>
              <th className="px-3 py-3">Paid</th>
              <th className="px-3 py-3">Duration</th>
              <th className="px-3 py-3">Ends</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subscribers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  No subscribers yet.
                </td>
              </tr>
            ) : (
              subscribers.map((s) => (
                <tr
                  key={s.id}
                  className={
                    s.status === "expired" || s.status === "warning"
                      ? "bg-red-50/80"
                      : "hover:bg-slate-50/80"
                  }
                >
                  <td className="px-3 py-3 font-semibold text-slate-900">
                    {s.name}
                  </td>
                  <td className="px-3 py-3">{s.phone || "—"}</td>
                  <td className="px-3 py-3 max-w-[180px] truncate">
                    {s.address || "—"}
                  </td>
                  <td className="px-3 py-3 font-semibold">
                    {format(s.paidAmount)}
                  </td>
                  <td className="px-3 py-3">{s.durationDays} days</td>
                  <td className="px-3 py-3">{formatDate(s.endDate)}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        s.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {s.status === "active"
                        ? `${s.daysLeft}d left`
                        : s.status === "warning"
                          ? `${s.daysLeft}d left`
                          : "Expired"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="rounded-lg px-2 py-1.5 font-semibold text-[var(--accent)]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleDelete(s.id, s.name)}
                      className="rounded-lg px-2 py-1.5 font-semibold text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        title={editing ? "Edit subscriber" : "Add subscriber"}
        onClose={() => setOpen(false)}
      >
        <form action={handleSubmit} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Name *</span>
            <input
              name="name"
              required
              defaultValue={editing?.name ?? ""}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Phone</span>
            <input
              name="phone"
              defaultValue={editing?.phone ?? ""}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Address</span>
            <textarea
              name="address"
              rows={2}
              defaultValue={editing?.address ?? ""}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Paid amount *
              </span>
              <input
                name="paidAmount"
                type="number"
                min="0"
                step="1"
                required
                defaultValue={editing?.paidAmount ?? ""}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Duration (days) *
              </span>
              <input
                name="durationDays"
                type="number"
                min="1"
                required
                defaultValue={editing?.durationDays ?? 30}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Start date</span>
            <input
              name="startDate"
              type="date"
              defaultValue={
                editing
                  ? editing.startDate.slice(0, 10)
                  : new Date().toISOString().slice(0, 10)
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Notes</span>
            <input
              name="notes"
              defaultValue={editing?.notes ?? ""}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
            />
          </label>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-base font-bold text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save subscriber"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
