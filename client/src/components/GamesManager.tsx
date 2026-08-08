import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { createGame, updateGame, deleteGame } from "@/lib/actions";

type Game = { id: number; name: string };

export function GamesManager({
  games,
  onChanged,
}: {
  games: Game[];
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setError(null);
    setOpen(true);
  }

  function openEdit(game: Game) {
    setEditing(game);
    setError(null);
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = editing
        ? await updateGame(formData)
        : await createGame(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      onChanged?.();
    });
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`Delete game "${name}"?`)) return;
    startTransition(async () => {
      await deleteGame(id);
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
          Add Game
        </button>
      </div>

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {games.length === 0 ? (
          <li className="px-4 py-8 text-center text-slate-500">No games yet.</li>
        ) : (
          games.map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50/80"
            >
              <span className="text-base font-semibold text-slate-900">
                {g.name}
              </span>
              <div>
                <button
                  type="button"
                  onClick={() => openEdit(g)}
                  className="mr-2 rounded-lg px-3 py-2 font-semibold text-[var(--accent)] hover:bg-slate-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleDelete(g.id, g.name)}
                  className="rounded-lg px-3 py-2 font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      <Modal
        open={open}
        title={editing ? "Edit Game" : "Add Game"}
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
              placeholder="FIFA"
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
            {pending ? "Saving…" : "Save Game"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
