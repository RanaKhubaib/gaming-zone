import { useMemo, useState, useTransition } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Modal } from "@/components/Modal";
import {
  updateSession,
  markSessionPaid,
  deleteSession,
} from "@/lib/actions";
import {
  formatDate,
  formatDateTime,
  formatDuration,
  toLocalInputValue,
} from "@/lib/format";
import { getDisplayGameName } from "@/lib/session-calc";
import { useMoney } from "@/components/SettingsProvider";

type StationOption = { id: number; name: string };
type GameOption = { id: number; name: string };

export type SessionRow = {
  id: number;
  customerName: string;
  customerPhone: string | null;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  price: number | null;
  paymentStatus: "PAID" | "UNPAID";
  notes: string | null;
  gameId: number | null;
  gameNameFreeText: string | null;
  game: { id: number; name: string } | null;
  station: { id: number; name: string };
};

export function SessionsTable({
  sessions,
  stations,
  games,
  onChanged,
}: {
  sessions: SessionRow[];
  stations: StationOption[];
  games: GameOption[];
  onChanged?: () => void;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [editing, setEditing] = useState<SessionRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [gameSelection, setGameSelection] = useState("");
  const { format } = useMoney();

  const filters = useMemo(
    () => ({
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
      stationId: searchParams.get("stationId") ?? "",
      paymentStatus: searchParams.get("paymentStatus") ?? "",
    }),
    [searchParams]
  );

  function applyFilters(formData: FormData) {
    const params = new URLSearchParams();
    const from = String(formData.get("from") || "");
    const to = String(formData.get("to") || "");
    const stationId = String(formData.get("stationId") || "");
    const paymentStatus = String(formData.get("paymentStatus") || "");
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (stationId) params.set("stationId", stationId);
    if (paymentStatus) params.set("paymentStatus", paymentStatus);
    navigate(`/sessions?${params.toString()}`);
  }

  function openEdit(session: SessionRow) {
    setEditing(session);
    setError(null);
    setGameSelection(
      session.gameId
        ? String(session.gameId)
        : session.gameNameFreeText
          ? "__new__"
          : ""
    );
  }

  function handleUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateSession(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setEditing(null);
      onChanged?.();
    });
  }

  function handleMarkPaid(id: number) {
    startTransition(async () => {
      await markSessionPaid(id);
      onChanged?.();
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this session? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteSession(id);
      onChanged?.();
    });
  }

  return (
    <div className="space-y-4">
      <form
        action={applyFilters}
        className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-5"
      >
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-600">From</span>
          <input
            type="date"
            name="from"
            defaultValue={filters.from}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-600">To</span>
          <input
            type="date"
            name="to"
            defaultValue={filters.to}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-600">Station</span>
          <select
            name="stationId"
            defaultValue={filters.stationId}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
          >
            <option value="">All</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-600">Payment</span>
          <select
            name="paymentStatus"
            defaultValue={filters.paymentStatus}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
          >
            <option value="">All</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-800 px-4 py-2.5 font-bold text-white hover:bg-slate-900"
          >
            Filter
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Station</th>
                  <th className="px-3 py-3">Customer</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Game</th>
              <th className="px-3 py-3">Duration</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Payment</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                  No sessions match these filters.
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80">
                  <td className="px-3 py-3">
                    <div className="font-medium">{formatDate(s.startTime)}</div>
                    <div className="text-xs text-slate-500">
                      {formatDateTime(s.startTime)}
                      {!s.endTime && (
                        <span
                          className="ml-1 font-semibold"
                          style={{ color: "var(--unpaid)" }}
                        >
                          · active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">{s.station.name}</td>
                  <td className="px-3 py-3 font-semibold">{s.customerName}</td>
                  <td className="px-3 py-3">{s.customerPhone || "—"}</td>
                  <td className="px-3 py-3">{getDisplayGameName(s)}</td>
                  <td className="px-3 py-3">
                    {s.endTime ? formatDuration(s.durationMinutes) : "—"}
                  </td>
                  <td className="px-3 py-3 font-semibold">
                    {s.endTime ? format(s.price) : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
                      style={{
                        backgroundColor:
                          s.paymentStatus === "PAID"
                            ? "var(--paid)"
                            : "var(--unpaid)",
                      }}
                    >
                      {s.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="rounded-lg px-2 py-1.5 font-semibold text-[var(--accent)] hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    {s.paymentStatus === "UNPAID" && s.endTime && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleMarkPaid(s.id)}
                        className="rounded-lg px-2 py-1.5 font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Mark paid
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleDelete(s.id)}
                      className="rounded-lg px-2 py-1.5 font-semibold text-red-600 hover:bg-red-50"
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
        open={!!editing}
        title="Edit Session"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <form action={handleUpdate} className="space-y-4">
            <input type="hidden" name="id" value={editing.id} />

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Customer name *
              </span>
              <input
                name="customerName"
                required
                defaultValue={editing.customerName}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Phone</span>
              <input
                name="customerPhone"
                defaultValue={editing.customerPhone ?? ""}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Game</span>
              <select
                name="gameSelection"
                value={gameSelection}
                onChange={(e) => setGameSelection(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
              >
                <option value="">— Select or type new —</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
                <option value="__new__">+ New game…</option>
              </select>
            </label>

            {(gameSelection === "__new__" || gameSelection === "") && (
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">
                  Game name
                </span>
                <input
                  name="gameFreeText"
                  defaultValue={editing.gameNameFreeText ?? ""}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Start time *
              </span>
              <input
                type="datetime-local"
                name="startTime"
                required
                defaultValue={toLocalInputValue(editing.startTime)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                End time (leave blank if still playing)
              </span>
              <input
                type="datetime-local"
                name="endTime"
                defaultValue={toLocalInputValue(editing.endTime)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Payment</span>
              <select
                name="paymentStatus"
                defaultValue={editing.paymentStatus}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PAID">Paid</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Notes</span>
              <textarea
                name="notes"
                rows={2}
                defaultValue={editing.notes ?? ""}
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
              {pending ? "Saving…" : "Save Changes"}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
