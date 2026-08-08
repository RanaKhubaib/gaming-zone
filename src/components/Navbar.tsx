"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { logoutAction } from "@/lib/auth-actions";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/stations", label: "Stations" },
  { href: "/games", label: "Games" },
  { href: "/sessions", label: "Sessions" },
  { href: "/subscribers", label: "Subscribers" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function Navbar({
  displayName,
  username,
}: {
  displayName: string;
  username: string;
}) {
  const pathname = usePathname();
  const { shopName, logoUrl } = useSettings();
  const [pending, startTransition] = useTransition();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 text-lg font-bold tracking-tight text-slate-900"
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="h-9 w-9 rounded-lg object-contain ring-1 ring-slate-200"
              />
            ) : null}
            <span>{shopName}</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{displayName}</span>
              <span className="text-slate-400"> · @{username}</span>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => logoutAction())}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {pending ? "…" : "Log out"}
            </button>
          </div>
        </div>

        <nav className="flex flex-wrap gap-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--accent)] text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
