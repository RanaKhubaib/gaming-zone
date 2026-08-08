import { Router } from "express";
import multer from "multer";
import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  differenceInCalendarDays,
} from "date-fns";
import { prisma } from "../lib/prisma";
import { getAppSettings, settingsToCssVars } from "../lib/settings";
import { getDisplayGameName } from "../lib/session-calc";
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSessionFromRequest,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "../lib/auth";
import { requireAuth } from "../middleware/auth";
import * as svc from "../lib/services";
import { buildSessionsCsv, importSessionsFromCsv } from "../lib/csv";
import { SESSION_CSV_TEMPLATE } from "../lib/csv";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
export const api = Router();

function sendResult(res: import("express").Response, result: { error?: string; [k: string]: unknown }) {
  if (result?.error) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
}

api.get("/bootstrap", async (req, res) => {
  try {
    const settings = await getAppSettings();
    const user = await getCurrentUser(req);
    res.json({
      settings,
      cssVars: settingsToCssVars(settings),
      user: user
        ? { id: user.id, username: user.username, displayName: user.displayName }
        : null,
    });
  } catch (e) {
    console.error("[bootstrap]", e);
    res.status(500).json({
      error: e instanceof Error ? e.message : "Bootstrap failed",
    });
  }
});

api.post("/auth/login", async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(400).json({ error: "Invalid username or password." });
    return;
  }
  const token = await createSessionToken({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
  });
  setSessionCookie(res, token);
  res.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    },
  });
});

api.post("/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

api.get("/auth/me", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    },
  });
});

api.put("/auth/account", requireAuth, async (req, res) => {
  const session = await getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const displayName = String(req.body.displayName || "").trim();
  const username = String(req.body.username || "").trim();
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");
  const confirmPassword = String(req.body.confirmPassword || "");

  if (!displayName) {
    res.status(400).json({ error: "Display name is required." });
    return;
  }
  if (!username || username.length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    res.status(400).json({ error: "User not found." });
    return;
  }

  const changingPassword = Boolean(newPassword || confirmPassword);
  if (changingPassword) {
    if (!currentPassword) {
      res.status(400).json({ error: "Enter your current password to set a new one." });
      return;
    }
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      res.status(400).json({ error: "Current password is incorrect." });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: "New password and confirmation do not match." });
      return;
    }
  } else if (username !== user.username) {
    if (!currentPassword || !(await verifyPassword(currentPassword, user.passwordHash))) {
      res.status(400).json({ error: "Enter your current password to change username." });
      return;
    }
  }

  const conflict = await prisma.user.findFirst({
    where: { username, NOT: { id: user.id } },
  });
  if (conflict) {
    res.status(400).json({ error: "That username is already taken." });
    return;
  }

  const data: { displayName: string; username: string; passwordHash?: string } = {
    displayName,
    username,
  };
  if (changingPassword) data.passwordHash = await hashPassword(newPassword);

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  const token = await createSessionToken({
    userId: updated.id,
    username: updated.username,
    displayName: updated.displayName,
  });
  setSessionCookie(res, token);
  res.json({
    success: true,
    user: {
      id: updated.id,
      username: updated.username,
      displayName: updated.displayName,
    },
  });
});

api.use(requireAuth);

api.get("/dashboard", async (_req, res) => {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const [stations, games, todaySessions, activeTimers] = await Promise.all([
    prisma.station.findMany({ orderBy: { id: "asc" } }),
    prisma.game.findMany({ orderBy: { name: "asc" } }),
    prisma.session.findMany({
      where: { startTime: { gte: dayStart, lte: dayEnd }, endTime: { not: null } },
    }),
    prisma.session.findMany({
      where: { endTime: null, entryMode: "TIMER" },
      include: { game: true },
    }),
  ]);
  res.json({
    stations,
    games,
    todayRevenue: todaySessions.reduce((s, x) => s + (x.price ?? 0), 0),
    todayCount: todaySessions.length,
    activeTimers: activeTimers.map((s) => ({
      id: s.id,
      stationId: s.stationId,
      customerName: s.customerName,
      customerPhone: s.customerPhone,
      startTime: s.startTime.toISOString(),
      bookedHours: s.bookedHours,
      gameNameFreeText: s.gameNameFreeText,
      notes: s.notes,
      game: s.game,
    })),
  });
});

api.get("/stations", async (_req, res) => {
  res.json(await prisma.station.findMany({ orderBy: { id: "asc" } }));
});
api.post("/stations", async (req, res) => sendResult(res, await svc.createStation(req.body)));
api.put("/stations", async (req, res) => sendResult(res, await svc.updateStation(req.body)));
api.delete("/stations/:id", async (req, res) =>
  sendResult(res, await svc.deleteStation(Number(req.params.id)))
);

api.get("/games", async (_req, res) => {
  res.json(await prisma.game.findMany({ orderBy: { name: "asc" } }));
});
api.post("/games", async (req, res) => sendResult(res, await svc.createGame(req.body)));
api.put("/games", async (req, res) => sendResult(res, await svc.updateGame(req.body)));
api.delete("/games/:id", async (req, res) =>
  sendResult(res, await svc.deleteGame(Number(req.params.id)))
);

api.get("/sessions", async (_req, res) => {
  const sessions = await prisma.session.findMany({
    include: { station: true, game: true },
    orderBy: { startTime: "desc" },
    take: 500,
  });
  res.json(
    sessions.map((s) => ({
      ...s,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime?.toISOString() ?? null,
    }))
  );
});
api.post("/sessions/manual", async (req, res) =>
  sendResult(res, await svc.createManualSession(req.body))
);
api.post("/sessions/timer/start", async (req, res) =>
  sendResult(res, await svc.startTimerSession(req.body))
);
api.post("/sessions/:id/extend", async (req, res) =>
  sendResult(res, await svc.extendTimerHour(Number(req.params.id)))
);
api.post("/sessions/:id/stop", async (req, res) =>
  sendResult(
    res,
    await svc.stopTimerSession(Number(req.params.id), {
      ignoreOvertime: Boolean(req.body?.ignoreOvertime),
    })
  )
);
api.post("/sessions/:id/paid", async (req, res) =>
  sendResult(res, await svc.markSessionPaid(Number(req.params.id)))
);
api.put("/sessions", async (req, res) => sendResult(res, await svc.updateSession(req.body)));
api.delete("/sessions/:id", async (req, res) =>
  sendResult(res, await svc.deleteSession(Number(req.params.id)))
);
api.get("/sessions/export", async (_req, res) => {
  const csv = await buildSessionsCsv();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="sessions.csv"');
  res.send(csv);
});
api.get("/sessions/template", (_req, res) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="sessions-template.csv"'
  );
  res.send(SESSION_CSV_TEMPLATE);
});
api.post("/sessions/import", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Please choose a CSV file." });
    return;
  }
  const text = req.file.buffer.toString("utf8");
  const result = await importSessionsFromCsv(text);
  res.json({ success: true, ...result });
});

api.get("/subscribers", async (_req, res) => {
  const settings = await getAppSettings();
  const rows = await prisma.subscriber.findMany({ orderBy: { endDate: "asc" } });
  const today = startOfDay(new Date());
  const warningDays = settings.subscriptionWarningDays;
  const subscribers = rows.map((s) => {
    const daysLeft = differenceInCalendarDays(startOfDay(s.endDate), today);
    let status: "active" | "warning" | "expired" = "active";
    if (daysLeft < 0) status = "expired";
    else if (daysLeft <= warningDays) status = "warning";
    return {
      id: s.id,
      name: s.name,
      phone: s.phone,
      address: s.address,
      paidAmount: s.paidAmount,
      durationDays: s.durationDays,
      startDate: s.startDate.toISOString(),
      endDate: s.endDate.toISOString(),
      notes: s.notes,
      daysLeft,
      status,
    };
  });
  res.json({ subscribers, warningDays });
});
api.post("/subscribers", async (req, res) =>
  sendResult(res, await svc.createSubscriber(req.body))
);
api.put("/subscribers", async (req, res) =>
  sendResult(res, await svc.updateSubscriber(req.body))
);
api.delete("/subscribers/:id", async (req, res) =>
  sendResult(res, await svc.deleteSubscriber(Number(req.params.id)))
);

api.get("/settings", async (_req, res) => {
  res.json(await getAppSettings());
});
api.put("/settings", async (req, res) =>
  sendResult(res, await svc.updateAppSettings(req.body))
);
api.post("/settings/logo", upload.single("logo"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Please choose a logo image." });
    return;
  }
  sendResult(
    res,
    await svc.uploadLogoBuffer(req.file.buffer, req.file.mimetype)
  );
});
api.delete("/settings/logo", async (_req, res) =>
  sendResult(res, await svc.removeLogo())
);

api.get("/reports", async (_req, res) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const last30Start = startOfDay(subDays(now, 29));

  const completed = await prisma.session.findMany({
    where: { endTime: { not: null } },
    include: { game: true, station: true },
  });

  const sum = (list: typeof completed) => ({
    revenue: list.reduce((a, s) => a + (s.price ?? 0), 0),
    sessions: list.length,
  });

  const todaySessions = completed.filter(
    (s) => s.startTime >= todayStart && s.startTime <= todayEnd
  );
  const weekSessions = completed.filter(
    (s) => s.startTime >= weekStart && s.startTime <= weekEnd
  );
  const monthSessions = completed.filter(
    (s) => s.startTime >= monthStart && s.startTime <= monthEnd
  );
  const last30 = completed.filter((s) => s.startTime >= last30Start);

  const days = eachDayOfInterval({ start: last30Start, end: todayStart });
  const dailyRevenue = days.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const revenue = last30
      .filter((s) => format(s.startTime, "yyyy-MM-dd") === key)
      .reduce((a, s) => a + (s.price ?? 0), 0);
    return { date: key, label: format(day, "dd MMM"), revenue: Math.round(revenue) };
  });

  const gameCounts = new Map<string, number>();
  for (const s of completed) {
    const name = getDisplayGameName(s);
    if (name === "—") continue;
    gameCounts.set(name, (gameCounts.get(name) ?? 0) + 1);
  }
  const topGames = [...gameCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const stationMinutes = new Map<string, number>();
  for (const s of completed) {
    stationMinutes.set(
      s.station.name,
      (stationMinutes.get(s.station.name) ?? 0) + (s.durationMinutes ?? 0)
    );
  }
  const busyStations = [...stationMinutes.entries()]
    .map(([name, minutes]) => ({
      name,
      minutes,
      hours: Math.round((minutes / 60) * 100) / 100,
    }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5);

  res.json({
    today: sum(todaySessions),
    week: sum(weekSessions),
    month: sum(monthSessions),
    dailyRevenue,
    topGames,
    busyStations,
  });
});
