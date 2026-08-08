const serverless = require("serverless-http");

let cached;
let cachedError;

/**
 * Catch-all for /api/* (except /api/health and /api/ping which have their own files).
 */
module.exports = async function handler(req, res) {
  const started = Date.now();
  try {
    console.log("[api]", req.method, req.url);

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

    if (cachedError) {
      res.status(500).json({ error: cachedError });
      return;
    }

    if (!cached) {
      try {
        console.log("[api] loading app…");
        const appModule = require("../server/dist/app");
        const app = appModule.default || appModule;
        cached = serverless(app);
        console.log("[api] app ready", Date.now() - started, "ms");
      } catch (e) {
        cachedError = e && e.message ? e.message : String(e);
        console.error("[api] failed to load app", e);
        res.status(500).json({ error: cachedError });
        return;
      }
    }

    return cached(req, res);
  } catch (e) {
    console.error("[api handler]", e);
    const message = e && e.message ? e.message : String(e);
    if (!res.headersSent) {
      res.status(500).json({ error: message, ms: Date.now() - started });
    }
  }
};
