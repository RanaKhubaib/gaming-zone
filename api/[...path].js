/**
 * Catch-all: /api/bootstrap, /api/dashboard, /api/health, ...
 * Static UI lives in /public (copied from client/dist in vercel-build).
 */
module.exports = async function handler(req, res) {
  try {
    if (!process.env.DATABASE_URL) {
      res.status(500).json({
        error:
          "DATABASE_URL is missing. Vercel → Settings → Environment Variables → add DATABASE_URL, DIRECT_URL, AUTH_SECRET → Redeploy.",
      });
      return;
    }
    if (!process.env.AUTH_SECRET || String(process.env.AUTH_SECRET).length < 16) {
      res.status(500).json({
        error:
          "AUTH_SECRET is missing or shorter than 16 characters on Vercel. Add it and Redeploy.",
      });
      return;
    }

    const app = require("../server/dist/app").default;

    // Ensure Express matches /api/... routes
    let url = req.url || "/";
    if (!url.startsWith("/api")) {
      req.url = "/api" + (url.startsWith("/") ? url : "/" + url);
    }

    return app(req, res);
  } catch (e) {
    console.error("[api handler]", e);
    const message = e && e.message ? e.message : String(e);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
};
