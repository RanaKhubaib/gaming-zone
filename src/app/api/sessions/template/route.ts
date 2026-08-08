import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { SESSION_CSV_TEMPLATE } from "@/lib/csv";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return new NextResponse(SESSION_CSV_TEMPLATE, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="sessions-import-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
