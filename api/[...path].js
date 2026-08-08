const serverless = require("serverless-http");

let cached;

/**
 * Catch-all for /api/* (except /api/health which has its own file).
 */
module.exports = async function handler(req, res) {
  try {
    const url = String(req.url || "");
    // Lightweight probes that avoid loading Express/Prisma
    if (url === "/ping" || url === "/api/ping" || url.endsWith("/ping")) {
      res.status(200).json({
        ok: true,
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        hasAuthSecret: Boolean(process.env.AUTH_SECRET),
        dbHost: (() => {
          try {
            return new URL(process.env.DATABASE_URL || "").hostname;
          } catch {
            return null;
          }
        })(),
      });
      return;
    }

    if (!process.env.DATABASE_URL) {
      res.status(500).json({
        error:
          "DATABASE_URL is missing. Import your .env in Vercel (DATABASE_URL, DIRECT_URL, AUTH_SECRET) and redeploy.",
      });
      return;
    }
    if (!process.env.AUTH_SECRET || String(process.env.AUTH_SECRET).length < 16) {
      res.status(500).json({
        error:
          "AUTH_SECRET is missing or shorter than 16 characters. Fix it in Vercel env vars and redeploy.",
      });
      return;
    }

    if (url === "/db" || url === "/api/db" || url.endsWith("/db")) {
      const started = Date.now();
      const { PrismaClient } = require("../server/generated/client");
      const prisma = new PrismaClient({
        datasources: { db: { url: process.env.DATABASE_URL } },
      });
      try {
        const rows = await Promise.race([
          prisma.$queryRaw`SELECT 1::int AS ok`,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Prisma query timed out after 8s")), 8000)
          ),
        ]);
        res.status(200).json({ ok: true, rows, ms: Date.now() - started });
      } finally {
        await prisma.$disconnect().catch(() => {});
      }
      return;
    }

    if (!cached) {
      const appModule = require("../server/dist/app");
      const app = appModule.default || appModule;
      cached = serverless(app);
    }

    return cached(req, res);
  } catch (e) {
    console.error("[api handler]", e);
    const message = e && e.message ? e.message : String(e);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
};
