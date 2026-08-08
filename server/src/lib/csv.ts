import { prisma } from "./prisma";
import { calculateSessionMetrics, getDisplayGameName } from "./session-calc";
import { EntryMode, PaymentStatus } from "./constants";
import { getAppSettings, settingsToPricingOptions } from "./settings";

export const SESSION_CSV_HEADERS = [
  "startTime",
  "endTime",
  "stationName",
  "customerName",
  "customerPhone",
  "game",
  "paymentStatus",
  "entryMode",
  "notes",
] as const;

export const SESSION_CSV_TEMPLATE = `${SESSION_CSV_HEADERS.join(",")}
2026-08-07T14:00,2026-08-07T15:30,PS5 - Station 1,Ali,03001234567,FIFA,PAID,MANUAL,
2026-08-07T16:00,,PC - Station 1,Sara,,Fortnite,UNPAID,MANUAL,Still playing
`;

function escapeCsv(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsv(text: string): string[][] {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return normalized
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map(parseCsvLine);
}

function toIsoLocal(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function buildSessionsCsv(): Promise<string> {
  const sessions = await prisma.session.findMany({
    include: { station: true, game: true },
    orderBy: { startTime: "desc" },
  });

  const lines = [SESSION_CSV_HEADERS.join(",")];
  for (const s of sessions) {
    lines.push(
      [
        escapeCsv(s.startTime.toISOString()),
        escapeCsv(s.endTime ? s.endTime.toISOString() : ""),
        escapeCsv(s.station.name),
        escapeCsv(s.customerName),
        escapeCsv(s.customerPhone),
        escapeCsv(getDisplayGameName(s)),
        escapeCsv(s.paymentStatus),
        escapeCsv(s.entryMode),
        escapeCsv(s.notes),
      ].join(",")
    );
  }
  return lines.join("\n") + "\n";
}

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

export async function importSessionsFromCsv(text: string): Promise<ImportResult> {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return { imported: 0, skipped: 0, errors: ["CSV has no data rows."] };
  }

  const header = rows[0].map((h) => h.trim());
  const required = ["startTime", "stationName", "customerName"];
  for (const col of required) {
    if (!header.includes(col)) {
      return {
        imported: 0,
        skipped: 0,
        errors: [`Missing required column: ${col}`],
      };
    }
  }

  const idx = (name: string) => header.indexOf(name);
  const stations = await prisma.station.findMany();
  const stationByName = new Map(
    stations.map((s) => [s.name.toLowerCase(), s])
  );

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const lineNo = r + 1;
    const get = (name: string) => {
      const i = idx(name);
      return i >= 0 ? (row[i] ?? "").trim() : "";
    };

    const startTime = toIsoLocal(get("startTime"));
    const endRaw = get("endTime");
    const endTime = endRaw ? toIsoLocal(endRaw) : null;
    const stationName = get("stationName");
    const customerName = get("customerName");
    const customerPhone = get("customerPhone") || null;
    const gameName = get("game");
    const paymentStatus =
      get("paymentStatus").toUpperCase() === "PAID"
        ? PaymentStatus.PAID
        : PaymentStatus.UNPAID;
    const entryMode =
      get("entryMode").toUpperCase() === "TIMER"
        ? EntryMode.TIMER
        : EntryMode.MANUAL;
    const notes = get("notes") || null;

    if (!startTime) {
      errors.push(`Row ${lineNo}: invalid startTime`);
      skipped++;
      continue;
    }
    if (!stationName || !customerName) {
      errors.push(`Row ${lineNo}: stationName and customerName are required`);
      skipped++;
      continue;
    }
    if (endTime && endTime < startTime) {
      errors.push(`Row ${lineNo}: endTime is before startTime`);
      skipped++;
      continue;
    }

    const station = stationByName.get(stationName.toLowerCase());
    if (!station) {
      errors.push(
        `Row ${lineNo}: unknown station "${stationName}" — add the station first`
      );
      skipped++;
      continue;
    }

    let gameId: number | null = null;
    let gameNameFreeText: string | null = null;
    if (gameName) {
      const existing = await prisma.game.findUnique({ where: { name: gameName } });
      if (existing) {
        gameId = existing.id;
      } else {
        const created = await prisma.game.create({ data: { name: gameName } });
        gameId = created.id;
      }
    }

    const pricing = settingsToPricingOptions(await getAppSettings());
    const { durationMinutes, price } = calculateSessionMetrics(
      startTime,
      endTime,
      station.hourlyRate,
      pricing
    );

    await prisma.session.create({
      data: {
        stationId: station.id,
        customerName,
        customerPhone,
        gameId,
        gameNameFreeText,
        startTime,
        endTime,
        durationMinutes,
        price,
        paymentStatus,
        entryMode,
        notes,
      },
    });

    // Only unfinished TIMER imports occupy a station (matches dashboard rules)
    if (!endTime && entryMode === EntryMode.TIMER) {
      await prisma.station.update({
        where: { id: station.id },
        data: { status: "OCCUPIED" },
      });
    }

    imported++;
  }

  return { imported, skipped, errors: errors.slice(0, 20) };
}
