import { useRef, useState, useTransition } from "react";
import { importSessionsCsvAction } from "@/lib/actions";

export function DataBackupPanel() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImport(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await importSessionsCsvAction(formData);
      if (result.error || typeof result.imported !== "number") {
        setError(result.error || "Import failed.");
        return;
      }
      const parts = [
        `Imported ${result.imported} session(s)`,
        result.skipped ? `${result.skipped} skipped` : null,
      ].filter(Boolean);
      let msg = parts.join(", ") + ".";
      const errors = result.errors;
      if (Array.isArray(errors) && errors.length) {
        msg += " Notes: " + errors.slice(0, 5).join(" · ");
      }
      setMessage(msg);
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">Data backup &amp; CSV</h2>
      <p className="mt-1 text-sm text-slate-600">
        Download all sessions as a CSV backup, or import sessions from a spreadsheet.
        Station names in the CSV must match stations already in the app.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a
          href="/api/sessions/export"
          className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white"
        >
          Download sessions CSV
        </a>
        <a
          href="/api/sessions/template"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Download sample template
        </a>
      </div>

      <form action={handleImport} className="mt-5 space-y-3 border-t border-slate-100 pt-5">
        <p className="text-sm font-semibold text-slate-800">Import sessions from CSV</p>
        <input
          ref={fileRef}
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold file:text-slate-700"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border-2 border-[var(--accent)] px-4 py-3 text-sm font-bold text-[var(--accent)] disabled:opacity-60"
        >
          {pending ? "Importing…" : "Import CSV"}
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          {message}
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Columns: startTime, endTime (optional), stationName, customerName, customerPhone,
        game, paymentStatus (PAID/UNPAID), entryMode (MANUAL/TIMER), notes. Times like{" "}
        <code className="rounded bg-slate-100 px-1">2026-08-07T14:00</code> work.
        Duration and price are calculated automatically from times × station rate.
      </p>
    </section>
  );
}
