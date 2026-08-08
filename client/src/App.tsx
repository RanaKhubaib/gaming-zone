import { useCallback, useEffect, useState, type CSSProperties } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { SettingsProvider } from "@/components/SettingsProvider";
import { api } from "@/lib/api";
import { DEFAULT_SETTINGS } from "@/lib/config";
import type { AppSettings, AuthUser } from "@/lib/types";
import { DashboardPage } from "@/pages/DashboardPage";
import { StationsPage } from "@/pages/StationsPage";
import { GamesPage } from "@/pages/GamesPage";
import { SessionsPage } from "@/pages/SessionsPage";
import { SubscribersPage } from "@/pages/SubscribersPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { LoginPage } from "@/pages/LoginPage";

type Bootstrap = {
  settings: AppSettings;
  cssVars: Record<string, string>;
  user: AuthUser | null;
};

function Protected({
  user,
  children,
}: {
  user: AuthUser | null;
  children: React.ReactNode;
}) {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

export default function App() {
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    api
      .get<Bootstrap>("/api/bootstrap")
      .then(setBoot)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-semibold text-red-700">{error}</p>
        <p className="text-sm text-slate-600">
          On Vercel, check Environment Variables:{" "}
          <code className="rounded bg-slate-200 px-1">DATABASE_URL</code>,{" "}
          <code className="rounded bg-slate-200 px-1">DIRECT_URL</code>,{" "}
          <code className="rounded bg-slate-200 px-1">AUTH_SECRET</code>.
        </p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            reload();
          }}
          className="rounded-xl bg-[var(--accent,#0f766e)] px-4 py-2 text-sm font-bold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!boot) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        Loading…
      </div>
    );
  }

  const settings = boot.settings ?? { id: 1, ...DEFAULT_SETTINGS };
  const user = boot.user;

  return (
    <SettingsProvider settings={settings}>
      <div
        className="flex min-h-screen flex-col bg-slate-100 text-slate-900"
        style={boot.cssVars as CSSProperties}
      >
        {user ? (
          <Navbar
            displayName={user.displayName}
            username={user.username}
            onLogout={() => setBoot({ ...boot, user: null })}
          />
        ) : null}
        <main
          className={
            user
              ? "mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6"
              : "w-full flex-1"
          }
        >
          <Routes>
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/" replace />
                ) : (
                  <LoginPage onSuccess={reload} />
                )
              }
            />
            <Route
              path="/"
              element={
                <Protected user={user}>
                  <DashboardPage />
                </Protected>
              }
            />
            <Route
              path="/stations"
              element={
                <Protected user={user}>
                  <StationsPage />
                </Protected>
              }
            />
            <Route
              path="/games"
              element={
                <Protected user={user}>
                  <GamesPage />
                </Protected>
              }
            />
            <Route
              path="/sessions"
              element={
                <Protected user={user}>
                  <SessionsPage />
                </Protected>
              }
            />
            <Route
              path="/subscribers"
              element={
                <Protected user={user}>
                  <SubscribersPage />
                </Protected>
              }
            />
            <Route
              path="/reports"
              element={
                <Protected user={user}>
                  <ReportsPage />
                </Protected>
              }
            />
            <Route
              path="/settings"
              element={
                <Protected user={user}>
                  <SettingsPage user={user!} onSettingsSaved={reload} />
                </Protected>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </SettingsProvider>
  );
}
