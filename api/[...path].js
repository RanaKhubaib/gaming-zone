const serverless = require("serverless-http");

let cached;

/**
 * Catch-all for /api/* (except /api/health which has its own file).
 */
module.exports = async function handler(req, res) {
  try {
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
