import { prisma } from "./prisma";
import { calculateSessionMetrics } from "./session-calc";
import { isValidHexColor } from "./format";
import { getAppSettings, settingsToPricingOptions } from "./settings";
import {
  EntryMode,
  PaymentStatus,
  StationStatus,
  type ConsoleType,
} from "./constants";

async function pricingOpts() {
  return settingsToPricingOptions(await getAppSettings());
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
      if (existing) return { gameId: existing.id, gameNameFreeText: null };
      const created = await prisma.game.create({ data: { name: trimmedFree } });
      return { gameId: created.id, gameNameFreeText: null };
    }
    return { gameId: null, gameNameFreeText: null };
  }

  const id = Number(gameSelection);
  if (!Number.isNaN(id)) return { gameId: id, gameNameFreeText: null };
  return { gameId: null, gameNameFreeText: trimmedFree };
}

export async function syncStationStatus(stationId: number) {
  const active = await prisma.session.findFirst({
    where: { stationId, endTime: null, entryMode: EntryMode.TIMER },
  });
  await prisma.station.update({
    where: { id: stationId },
    data: {
      status: active ? StationStatus.OCCUPIED : StationStatus.AVAILABLE,
    },
  });
}

type Body = Record<string, unknown>;

function str(v: unknown, fallback = "") {
  return String(v ?? fallback).trim();
}

export async function updateAppSettings(body: Body) {
  const shopName = str(body.shopName);
  const currencySymbol = str(body.currencySymbol);
  const currencyCode = str(body.currencyCode).toUpperCase();
  const accentColor = str(body.accentColor);
  const availableColor = str(body.availableColor);
  const occupiedColor = str(body.occupiedColor);
  const unpaidColor = str(body.unpaidColor);
  const paidColor = str(body.paidColor);
  const defaultCustomerName = str(body.defaultCustomerName);
  const liveTimerEnabled = Boolean(body.liveTimerEnabled);
  const showLiveRunningCost = Boolean(body.showLiveRunningCost);
  const roundUpToFullHours = Boolean(body.roundUpToFullHours);
  const minBillableHours = Number(body.minBillableHours);
  const subscriptionWarningDays = Number(body.subscriptionWarningDays ?? 7);

  if (!shopName) return { error: "Shop name is required." };
  if (!currencySymbol) return { error: "Currency symbol is required." };
  if (!currencyCode) return { error: "Currency code is required." };
  if (Number.isNaN(minBillableHours) || minBillableHours < 0) {
    return { error: "Minimum billable hours must be 0 or greater." };
  }
  if (Number.isNaN(subscriptionWarningDays) || subscriptionWarningDays < 1) {
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

  const data = {
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
  };

  await prisma.settings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  return { success: true };
}

export async function uploadLogoBuffer(buffer: Buffer, mime: string) {
  const allowed = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];
  if (!allowed.includes(mime)) {
    return { error: "Logo must be PNG, JPG, WEBP, GIF, or SVG." };
  }
  if (buffer.length > 2 * 1024 * 1024) {
    return { error: "Logo must be under 2 MB." };
  }
  const logoUrl = `data:${mime};base64,${buffer.toString("base64")}`;
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { logoUrl },
    create: { id: 1, logoUrl },
  });
  return { success: true, logoUrl };
}

export async function removeLogo() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { logoUrl: null },
    create: { id: 1, logoUrl: null },
  });
  return { success: true };
}

export async function createStation(body: Body) {
  const name = str(body.name);
  const consoleType = str(body.consoleType || "OTHER") as ConsoleType;
  const hourlyRate = Number(body.hourlyRate);
  if (!name) return { error: "Station name is required." };
  if (Number.isNaN(hourlyRate) || hourlyRate < 0) {
    return { error: "Hourly rate must be a valid number." };
  }
  await prisma.station.create({ data: { name, consoleType, hourlyRate } });
  return { success: true };
}

export async function updateStation(body: Body) {
  const id = Number(body.id);
  const name = str(body.name);
  const consoleType = str(body.consoleType || "OTHER") as ConsoleType;
  const hourlyRate = Number(body.hourlyRate);
  if (!id || !name) return { error: "Invalid station data." };
  if (Number.isNaN(hourlyRate) || hourlyRate < 0) {
    return { error: "Hourly rate must be a valid number." };
  }
  await prisma.station.update({
    where: { id },
    data: { name, consoleType, hourlyRate },
  });
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
  return { success: true };
}

export async function createGame(body: Body) {
  const name = str(body.name);
  if (!name) return { error: "Game name is required." };
  const existing = await prisma.game.findUnique({ where: { name } });
  if (existing) return { error: "A game with this name already exists." };
  await prisma.game.create({ data: { name } });
  return { success: true };
}

export async function updateGame(body: Body) {
  const id = Number(body.id);
  const name = str(body.name);
  if (!id || !name) return { error: "Invalid game data." };
  const conflict = await prisma.game.findFirst({
    where: { name, NOT: { id } },
  });
  if (conflict) return { error: "A game with this name already exists." };
  await prisma.game.update({ where: { id }, data: { name } });
  return { success: true };
}

export async function deleteGame(id: number) {
  await prisma.session.updateMany({
    where: { gameId: id },
    data: { gameId: null },
  });
  await prisma.game.delete({ where: { id } });
  return { success: true };
}

export async function createManualSession(body: Body) {
  const stationId = Number(body.stationId);
  const customerName = str(body.customerName);
  const customerPhone = str(body.customerPhone) || null;
  const gameSelection = str(body.gameSelection);
  const gameFreeText = str(body.gameFreeText);
  const startRaw = str(body.startTime);
  const endRaw = str(body.endTime);
  const notes = str(body.notes) || null;
  const paymentStatus =
    str(body.paymentStatus) === "PAID" || body.paymentStatus === true
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
  return { success: true };
}

export async function startTimerSession(body: Body) {
  const stationId = Number(body.stationId);
  const customerName = str(body.customerName);
  const customerPhone = str(body.customerPhone) || null;
  const gameSelection = str(body.gameSelection);
  const gameFreeText = str(body.gameFreeText);
  const notes = str(body.notes) || null;
  const bookedHours = Number(body.bookedHours || 1);

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
  return { success: true };
}

export async function extendTimerHour(sessionId: number) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
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
  return { success: true, bookedHours: nextHours };
}

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
  if (options?.ignoreOvertime && now > bookedEnd) endTime = bookedEnd;

  const durationMinutes =
    Math.round(
      ((endTime.getTime() - session.startTime.getTime()) / (1000 * 60)) * 100
    ) / 100;

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
  return { success: true };
}

export async function updateSession(body: Body) {
  const id = Number(body.id);
  const customerName = str(body.customerName);
  const customerPhone = str(body.customerPhone) || null;
  const gameSelection = str(body.gameSelection);
  const gameFreeText = str(body.gameFreeText);
  const startRaw = str(body.startTime);
  const endRaw = str(body.endTime);
  const notes = str(body.notes) || null;
  const paymentStatus = str(body.paymentStatus || PaymentStatus.UNPAID);

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
  return { success: true };
}

export async function markSessionPaid(id: number) {
  await prisma.session.update({
    where: { id },
    data: { paymentStatus: PaymentStatus.PAID },
  });
  return { success: true };
}

export async function deleteSession(id: number) {
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) return { error: "Session not found." };
  await prisma.session.delete({ where: { id } });
  await syncStationStatus(session.stationId);
  return { success: true };
}

export async function createSubscriber(body: Body) {
  const name = str(body.name);
  const phone = str(body.phone) || null;
  const address = str(body.address) || null;
  const paidAmount = Number(body.paidAmount);
  const durationDays = Number(body.durationDays);
  const startRaw = str(body.startDate);
  const notes = str(body.notes) || null;

  if (!name) return { error: "Name is required." };
  if (Number.isNaN(paidAmount) || paidAmount < 0) {
    return { error: "Paid amount must be a valid number." };
  }
  if (Number.isNaN(durationDays) || durationDays < 1) {
    return { error: "Duration must be at least 1 day." };
  }

  const startDate = startRaw ? new Date(startRaw) : new Date();
  if (Number.isNaN(startDate.getTime())) return { error: "Invalid start date." };
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
  return { success: true };
}

export async function updateSubscriber(body: Body) {
  const id = Number(body.id);
  const name = str(body.name);
  const phone = str(body.phone) || null;
  const address = str(body.address) || null;
  const paidAmount = Number(body.paidAmount);
  const durationDays = Number(body.durationDays);
  const startRaw = str(body.startDate);
  const notes = str(body.notes) || null;

  if (!id) return { error: "Invalid subscriber." };
  if (!name) return { error: "Name is required." };
  if (Number.isNaN(paidAmount) || paidAmount < 0) {
    return { error: "Paid amount must be a valid number." };
  }
  if (Number.isNaN(durationDays) || durationDays < 1) {
    return { error: "Duration must be at least 1 day." };
  }

  const startDate = startRaw ? new Date(startRaw) : new Date();
  if (Number.isNaN(startDate.getTime())) return { error: "Invalid start date." };
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
  return { success: true };
}

export async function deleteSubscriber(id: number) {
  await prisma.subscriber.delete({ where: { id } });
  return { success: true };
}
