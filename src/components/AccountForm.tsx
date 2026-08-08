"use client";

import { useState, useTransition } from "react";
import { updateAccountAction } from "@/lib/auth-actions";

type AccountUser = {
  id: number;
  username: string;
  displayName: string;
};

export function AccountForm({ user }: { user: AccountUser }) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateAccountAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMessage("Account updated.");
    });
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">Account</h2>
      <p className="mt-1 text-sm text-slate-600">
        Update your display name, username, or password. Changing username or
        password requires your current password.
      </p>

      <form action={handleSubmit} className="mt-4 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">
            Display name *
          </span>
          <input
            name="displayName"
            required
            defaultValue={user.displayName}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">
            Username *
          </span>
          <input
            name="username"
            required
            defaultValue={user.username}
            autoComplete="username"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">
            Current password
          </span>
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            placeholder="Required to change username/password"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">
              New password
            </span>
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Leave blank to keep"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">
              Confirm new password
            </span>
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[var(--accent)] px-5 py-3 text-base font-bold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save account"}
        </button>
      </form>
    </section>
  );
}
