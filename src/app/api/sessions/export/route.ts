import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { buildSessionsCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csv = await buildSessionsCsv();
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sessions-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
