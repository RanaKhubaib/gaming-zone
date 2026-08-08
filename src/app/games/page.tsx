import { prisma } from "@/lib/prisma";
import { GamesManager } from "@/components/GamesManager";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const games = await prisma.game.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Games
        </h1>
        <p className="mt-1 text-slate-600">
          Games appear in the session dropdown
        </p>
      </div>
      <GamesManager games={games} />
    </div>
  );
}
