import { useCallback, useEffect, useState } from "react";
import { GamesManager } from "@/components/GamesManager";
import { api } from "@/lib/api";

export function GamesPage() {
  const [games, setGames] = useState<{ id: number; name: string }[]>([]);
  const load = useCallback(() => {
    api.get<{ id: number; name: string }[]>("/api/games").then(setGames);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Games</h1>
        <p className="mt-1 text-slate-600">Catalog of games for session logging</p>
      </div>
      <GamesManager games={games} onChanged={load} />
    </div>
  );
}
