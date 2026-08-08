"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { calculateSessionMetrics } from "@/lib/session-calc";
import { isValidHexColor } from "@/lib/format";
import { getAppSettings, settingsToPricingOptions } from "@/lib/settings";
import {
  EntryMode,
  PaymentStatus,
  StationStatus,
  type ConsoleType,
} from "@/lib/constants";

async function pricingOpts() {
  const settings = await getAppSettings();
  return settingsToPricingOptions(settings);
}

async function resolveGame(
  gameSelection: string,
  freeText?: string
): Promise<{ gameId: number | null; gameNameFreeText: string | null }> {
  const trimmedFree = freeText?.trim() || null;

  if (gameSelection === "__new__" || gameSelection === "") {
    if (trimmedFree) {
      const existing = await prisma.game.findUnique({
        where: { name: trimmedFree },
      });
      if (existing) {
        return { gameId: existing.id, gameNameFreeText: null };
      }
      const created = await prisma.game.create({ data: { name: trimmedFree } });
      return { gameId: created.id, gameNameFreeText: null };
    }
    return { gameId: null, gameNameFreeText: null };
  }

  const id = Number(gameSelection);
  if (!Number.isNaN(id)) {
    return { gameId: id, gameNameFreeText: null };
  }

  return { gameId: null, gameNameFreeText: trimmedFree };
}

async function syncStationStatus(stationId: number) {
  // Only live TIMER sessions occupy a station (manual logs go straight to history)
  const active = await prisma.session.findFirst({
    where: {
      stationId,
      endTime: null,
      entryMode: EntryMode.TIMER,
    },
  });
  await prisma.station.update({
    where: { id: stationId },
    data: {
      status: active ? StationStatus.OCCUPIED : StationStatus.AVAILABLE,
    },
  });
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/stations");
  revalidatePath("/games");
  revalidatePath("/sessions");
  revalidatePath("/reports");
  revalidatePath("/settings");
  revalidatePath("/subscribers");
}

export async function updateAppSettings(formData: FormData) {
  const shopName = String(formData.get("shopName") || "").trim();
  const currencySymbol = String(formData.get("currencySymbol") || "").trim();
  const currencyCode = String(formData.get("currencyCode") || "").trim().toUpperCase();
  const accentColor = String(formData.get("accentColor") || "").trim();
  const availableColor = String(formData.get("availableColor") || "").trim();
  const occupiedColor = String(formData.get("occupiedColor") || "").trim();
  const unpaidColor = String(formData.get("unpaidColor") || "").trim();
  const paidColor = String(formData.get("paidColor") || "").trim();
  const defaultCustomerName = String(
    formData.get("defaultCustomerName") || ""
  ).trim();
  const liveTimerEnabled = formData.get("liveTimerEnabled") === "on";
  const showLiveRunningCost = formData.get("showLiveRunningCost") === "on";
  const roundUpToFullHours = formData.get("roundUpToFullHours") === "on";
  const minBillableHours = Number(formData.get("minBillableHours"));
  const subscriptionWarningDays = Number(
    formData.get("subscriptionWarningDays") || 7
  );

  if (!shopName) return { error: "Shop name is required." };
  if (!currencySymbol) return { error: "Currency symbol is required." };
  if (!currencyCode) return { error: "Currency code is required." };
  if (Number.isNaN(minBillableHours) || minBillableHours < 0) {
    return { error: "Minimum billable hours must be 0 or greater." };
  }
  if (
    Number.isNaN(subscriptionWarningDays) ||
    subscriptionWarningDays < 1
  ) {
    return { error: "Subscription warning days must be at least 1." };
  }

  const colors = {
    accentColor,
    availableColor,
    occupiedColor,
    unpaidColor,
    paidColor,
  };
  for (const [key, value] of Object.entries(colors)) {
    if (!isValidHexColor(value)) {
      return { error: `Invalid color for ${key}. Use hex like #0f766e.` };
    }
  }

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      shopName,
      currencySymbol,
      currencyCode,
      accentColor,
      availableColor,
      occupiedColor,
      unpaidColor,
      paidColor,
      defaultCustomerName: defaultCustomerName || "Walk-in",
      liveTimerEnabled,
      showLiveRunningCost,
      roundUpToFullHours,
      minBillableHours,
      subscriptionWarningDays,
    },
    create: {
      id: 1,
      shopName,
      currencySymbol,
      currencyCode,
      accentColor,
      availableColor,
      occupiedColor,
      unpaidColor,
      paidColor,
      defaultCustomerName: defaultCustomerName || "Walk-in",
      liveTimerEnabled,
      showLiveRunningCost,
      roundUpToFullHours,
      minBillableHours,
      subscriptionWarningDays,
    },
  });

  revalidateAll();
  return { success: true };
}

export async function uploadLogo(formData: FormData) {
  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) {
    return { error: "Please choose a logo image." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: "Logo must be under 2 MB." };
  }

  const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
  if (!allowed.includes(file.type)) {
    return { error: "Logo must be PNG, JPG, WEBP, GIF, or SVG." };
  }

  // Store as data URL so logos work on Vercel (no local disk writes)
  const buffer = Buffer.from(await file.arrayBuffer());
  const logoUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  await prisma.settings.upsert({
    where: { id: 1 },
    update: { logoUrl },
    create: { id: 1, logoUrl },
  });

  revalidateAll();
  return { success: true, logoUrl };
}

export async function removeLogo() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { logoUrl: null },
    create: { id: 1, logoUrl: null },
  });

  revalidateAll();
  return { success: true };
}

// ─── Stations ───────────────────────────────────────────────

export async function createStation(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const consoleType = String(formData.get("consoleType") || "OTHER") as ConsoleType;
  const hourlyRate = Number(formData.get("hourlyRate"));

  if (!name) return { error: "Station name is required." };
  if (Number.isNaN(hourlyRate) || hourlyRate < 0) {
    return { error: "Hourly rate must be a valid number." };
  }

  await prisma.station.create({
    data: { name, consoleType, hourlyRate },
  });
  revalidateAll();
  return { success: true };
}

export async function updateStation(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const consoleType = String(formData.get("consoleType") || "OTHER") as ConsoleType;
  const hourlyRate = Number(formData.get("hourlyRate"));

  if (!id || !name) return { error: "Invalid station data." };
  if (Number.isNaN(hourlyRate) || hourlyRate < 0) {
    return { error: "Hourly rate must be a valid number." };
  }

  await prisma.station.update({
    where: { id },
    data: { name, consoleType, hourlyRate },
  });
  revalidateAll();
  return { success: true };
}

export async function deleteStation(id: number) {
  const active = await prisma.session.findFirst({
    where: { stationId: id, endTime: null },
  });
  if (active) {
    return { error: "Cannot delete a station with an active session." };
  }

  await prisma.session.deleteMany({ where: { stationId: id } });
  await prisma.station.delete({ where: { id } });
  revalidateAll();
  return { success: true };
}

// ─── Games ──────────────────────────────────────────────────

export async function createGame(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Game name is required." };

  const existing = await prisma.game.findUnique({ where: { name } });
  if (existing) return { error: "A game with this name already exists." };

  await prisma.game.create({ data: { name } });
  revalidateAll();
  return { success: true };
}

export async function updateGame(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  if (!id || !name) return { error: "Invalid game data." };

  const conflict = await prisma.game.findFirst({
    where: { name, NOT: { id } },
  });
  if (conflict) return { error: "A game with this name already exists." };

  await prisma.game.update({ where: { id }, data: { name } });
  revalidateAll();
  return { success: true };
}

export async function deleteGame(id: number) {
  await prisma.session.updateMany({
    where: { gameId: id },
    data: { gameId: null },
  });
  await prisma.game.delete({ where: { id } });
  revalidateAll();
  return { success: true };
}

// ─── Sessions ───────────────────────────────────────────────

export async function createManualSession(formData: FormData) {
  const stationId = Number(formData.get("stationId"));
  const customerName = String(formData.get("customerName") || "").trim();
  const customerPhone = String(formData.get("customerPhone") || "").trim() || null;
  const gameSelection = String(formData.get("gameSelection") || "");
  const gameFreeText = String(formData.get("gameFreeText") || "");
  const startRaw = String(formData.get("startTime") || "");
  const endRaw = String(formData.get("endTime") || "");
  const notes = String(formData.get("notes") || "").trim() || null;
  const paymentStatus =
    String(formData.get("paymentStatus") || "") === "PAID"
      ? PaymentStatus.PAID
      : PaymentStatus.UNPAID;

  if (!stationId) return { error: "Station is required." };
  if (!customerName) return { error: "Customer name is required." };
  if (!startRaw) return { error: "Start time is required." };
  if (!endRaw) {
    return {
      error:
        "End time is required for manual sessions (they save straight to Sessions history).",
    };
  }

  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) return { error: "Station not found." };

  const startTime = new Date(startRaw);
  const endTime = new Date(endRaw);

  if (endTime < startTime) {
    return { error: "End time cannot be before start time." };
  }

  const { gameId, gameNameFreeText } = await resolveGame(
    gameSelection,
    gameFreeText
  );
  const { durationMinutes, price } = calculateSessionMetrics(
    startTime,
    endTime,
    station.hourlyRate,
    await pricingOpts()
  );

  await prisma.session.create({
    data: {
      stationId,
      customerName,
      customerPhone,
      gameId,
      gameNameFreeText,
      startTime,
      endTime,
      durationMinutes,
      price,
      entryMode: EntryMode.MANUAL,
      paymentStatus,
      notes,
    },
  });

  // Manual sessions never occupy the dashboard — history only
  revalidateAll();
  return { success: true };
}

export async function startTimerSession(formData: FormData) {
  const stationId = Number(formData.get("stationId"));
  const customerName = String(formData.get("customerName") || "").trim();
  const customerPhone = String(formData.get("customerPhone") || "").trim() || null;
  const gameSelection = String(formData.get("gameSelection") || "");
  const gameFreeText = String(formData.get("gameFreeText") || "");
  const notes = String(formData.get("notes") || "").trim() || null;
  const bookedHours = Number(formData.get("bookedHours") || 1);

  if (!stationId) return { error: "Station is required." };
  if (!customerName) return { error: "Customer name is required." };
  if (Number.isNaN(bookedHours) || bookedHours < 0.5) {
    return { error: "Book at least 0.5 hours." };
  }

  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) return { error: "Station not found." };

  const activeTimer = await prisma.session.findFirst({
    where: { stationId, endTime: null, entryMode: EntryMode.TIMER },
  });
  if (activeTimer || station.status === StationStatus.OCCUPIED) {
    return { error: "This station already has a live timer session." };
  }

  const { gameId, gameNameFreeText } = await resolveGame(
    gameSelection,
    gameFreeText
  );

  await prisma.session.create({
    data: {
      stationId,
      customerName,
      customerPhone,
      gameId,
      gameNameFreeText,
      startTime: new Date(),
      entryMode: EntryMode.TIMER,
      bookedHours,
      notes,
    },
  });

  await prisma.station.update({
    where: { id: stationId },
    data: { status: StationStatus.OCCUPIED },
  });

  revalidateAll();
  return { success: true };
}

/** Add one more paid hour to an active timer (extends countdown). */
export async function extendTimerHour(sessionId: number) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { station: true },
  });
  if (!session) return { error: "Session not found." };
  if (session.endTime) return { error: "Session already stopped." };
  if (session.entryMode !== EntryMode.TIMER) {
    return { error: "Only timer sessions can be extended." };
  }

  const nextHours = (session.bookedHours ?? 1) + 1;
  await prisma.session.update({
    where: { id: sessionId },
    data: { bookedHours: nextHours },
  });

  revalidateAll();
  return { success: true, bookedHours: nextHours };
}

/**
 * Finish timer.
 * - ignoreOvertime: charge only booked hours (don't bill extra minutes past the hour)
 * - otherwise: end now; for early stop still charge booked hours (prepaid block)
 */
export async function stopTimerSession(
  sessionId: number,
  options?: { ignoreOvertime?: boolean }
) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { station: true },
  });
  if (!session) return { error: "Session not found." };
  if (session.endTime) return { error: "Session already stopped." };

  const now = new Date();
  const bookedHours = session.bookedHours ?? 1;
  const bookedEnd = new Date(
    session.startTime.getTime() + bookedHours * 60 * 60 * 1000
  );

  let endTime = now;
  if (options?.ignoreOvertime && now > bookedEnd) {
    // Cap end at the booked block so overtime minutes aren't billed
    endTime = bookedEnd;
  }

  const durationMinutes =
    Math.round(
      ((endTime.getTime() - session.startTime.getTime()) / (1000 * 60)) * 100
    ) / 100;

  // Timer sessions bill by booked hours × rate
  const price =
    session.entryMode === EntryMode.TIMER
      ? Math.round(bookedHours * session.station.hourlyRate * 100) / 100
      : (
          await calculateSessionMetrics(
            session.startTime,
            endTime,
            session.station.hourlyRate,
            await pricingOpts()
          )
        ).price;

  await prisma.session.update({
    where: { id: sessionId },
    data: {
      endTime,
      durationMinutes,
      price: price ?? 0,
      bookedHours,
    },
  });

  await syncStationStatus(session.stationId);
  revalidateAll();
  return { success: true };
}

export async function updateSession(formData: FormData) {
  const id = Number(formData.get("id"));
  const customerName = String(formData.get("customerName") || "").trim();
  const customerPhone =
    String(formData.get("customerPhone") || "").trim() || null;
  const gameSelection = String(formData.get("gameSelection") || "");
  const gameFreeText = String(formData.get("gameFreeText") || "");
  const startRaw = String(formData.get("startTime") || "");
  const endRaw = String(formData.get("endTime") || "");
  const notes = String(formData.get("notes") || "").trim() || null;
  const paymentStatus = String(
    formData.get("paymentStatus") || PaymentStatus.UNPAID
  );

  if (!id) return { error: "Invalid session." };
  if (!customerName) return { error: "Customer name is required." };
  if (!startRaw) return { error: "Start time is required." };

  const session = await prisma.session.findUnique({
    where: { id },
    include: { station: true },
  });
  if (!session) return { error: "Session not found." };

  const startTime = new Date(startRaw);
  const endTime = endRaw ? new Date(endRaw) : null;

  if (endTime && endTime < startTime) {
    return { error: "End time cannot be before start time." };
  }

  const { gameId, gameNameFreeText } = await resolveGame(
    gameSelection,
    gameFreeText
  );
  const { durationMinutes, price } = calculateSessionMetrics(
    startTime,
    endTime,
    session.station.hourlyRate,
    await pricingOpts()
  );

  await prisma.session.update({
    where: { id },
    data: {
      customerName,
      customerPhone,
      gameId,
      gameNameFreeText,
      startTime,
      endTime,
      durationMinutes,
      price,
      paymentStatus,
      notes,
    },
  });

  await syncStationStatus(session.stationId);
  revalidateAll();
  return { success: true };
}

export async function markSessionPaid(id: number) {
  await prisma.session.update({
    where: { id },
    data: { paymentStatus: PaymentStatus.PAID },
  });
  revalidateAll();
  return { success: true };
}

export async function deleteSession(id: number) {
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) return { error: "Session not found." };

  await prisma.session.delete({ where: { id } });
  await syncStationStatus(session.stationId);
  revalidateAll();
  return { success: true };
}

export async function importSessionsCsvAction(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "Please choose a CSV file." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "CSV must be under 5 MB." };
  }

  const text = await file.text();
  const { importSessionsFromCsv } = await import("@/lib/csv");
  const result = await importSessionsFromCsv(text);
  revalidateAll();
  return { success: true, ...result };
}

// ─── Subscribers ────────────────────────────────────────────

export async function createSubscriber(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const paidAmount = Number(formData.get("paidAmount"));
  const durationDays = Number(formData.get("durationDays"));
  const startRaw = String(formData.get("startDate") || "");
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!name) return { error: "Name is required." };
  if (Number.isNaN(paidAmount) || paidAmount < 0) {
    return { error: "Paid amount must be a valid number." };
  }
  if (Number.isNaN(durationDays) || durationDays < 1) {
    return { error: "Duration must be at least 1 day." };
  }

  const startDate = startRaw ? new Date(startRaw) : new Date();
  if (Number.isNaN(startDate.getTime())) {
    return { error: "Invalid start date." };
  }
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);

  await prisma.subscriber.create({
    data: {
      name,
      phone,
      address,
      paidAmount,
      durationDays,
      startDate,
      endDate,
      notes,
    },
  });

  revalidateAll();
  return { success: true };
}

export async function updateSubscriber(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const paidAmount = Number(formData.get("paidAmount"));
  const durationDays = Number(formData.get("durationDays"));
  const startRaw = String(formData.get("startDate") || "");
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!id) return { error: "Invalid subscriber." };
  if (!name) return { error: "Name is required." };
  if (Number.isNaN(paidAmount) || paidAmount < 0) {
    return { error: "Paid amount must be a valid number." };
  }
  if (Number.isNaN(durationDays) || durationDays < 1) {
    return { error: "Duration must be at least 1 day." };
  }

  const startDate = startRaw ? new Date(startRaw) : new Date();
  if (Number.isNaN(startDate.getTime())) {
    return { error: "Invalid start date." };
  }
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);

  await prisma.subscriber.update({
    where: { id },
    data: {
      name,
      phone,
      address,
      paidAmount,
      durationDays,
      startDate,
      endDate,
      notes,
    },
  });

  revalidateAll();
  return { success: true };
}

export async function deleteSubscriber(id: number) {
  await prisma.subscriber.delete({ where: { id } });
  revalidateAll();
  return { success: true };
}
