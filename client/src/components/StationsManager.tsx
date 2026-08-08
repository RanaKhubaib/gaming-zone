import { useState, useTransition } from "react";
import {
  ConsoleType,
  type StationStatus,
} from "@/lib/constants";
import { Modal } from "@/components/Modal";
import { createStation, updateStation, deleteStation } from "@/lib/actions";
import { useMoney } from "@/components/SettingsProvider";

type Station = {
  id: number;
  name: string;
  consoleType: ConsoleType;
  hourlyRate: number;
  status: StationStatus;
};

const CONSOLE_TYPES = Object.values(ConsoleType);

export function StationsManager({
  stations,
  onChanged,
}: {
  stations: Station[];
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { format } = useMoney();

  function openCreate() {
    setEditing(null);
    setError(null);
    setOpen(true);
  }

  function openEdit(station: Station) {
    setEditing(station);
    setError(null);
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = editing
        ? await updateStation(formData)
        : await createStation(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      onChanged?.();
    });
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`Delete station "${name}"? Past sessions for it will also be removed.`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteStation(id);
      if (result?.error) alert(result.error);
      else onChanged?.();
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
          Add Station
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Console</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No stations yet.
                </td>
              </tr>
            ) : (
              stations.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {s.name}
                  </td>
                  <td className="px-4 py-3">{s.consoleType}</td>
                  <td className="px-4 py-3">
                    {format(s.hourlyRate)}/hr
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
                      style={{
                        backgroundColor:
                          s.status === "OCCUPIED"
                            ? "var(--occupied)"
                            : "var(--available)",
                      }}
                    >
                      {s.status === "OCCUPIED" ? "Occupied" : "Available"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="mr-2 rounded-lg px-3 py-2 font-semibold text-[var(--accent)] hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleDelete(s.id, s.name)}
                      className="rounded-lg px-3 py-2 font-semibold text-red-600 hover:bg-red-50"
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
        title={editing ? "Edit Station" : "Add Station"}
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
              placeholder="PS5 - Station 1"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Console type</span>
            <select
              name="consoleType"
              defaultValue={editing?.consoleType ?? "PS5"}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
            >
              {CONSOLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">
              Hourly rate (PKR) *
            </span>
            <input
              name="hourlyRate"
              type="number"
              min="0"
              step="1"
              required
              defaultValue={editing?.hourlyRate ?? 300}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
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
            {pending ? "Saving…" : "Save Station"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
