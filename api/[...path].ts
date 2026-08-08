import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Catch-all /api/* → Express app.
 * Wrapped so import/runtime crashes still return JSON (not a blank 500).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!process.env.DATABASE_URL) {
      res.status(500).json({
        error:
          "DATABASE_URL is missing on Vercel. Add it in Project → Settings → Environment Variables, then Redeploy.",
      });
      return;
    }
    if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) {
      res.status(500).json({
        error:
          "AUTH_SECRET is missing or too short on Vercel (need 16+ characters). Add it and Redeploy.",
      });
      return;
    }

    const mod = await import("../server/src/app");
    const app = mod.default;
    return app(req as never, res as never);
  } catch (e) {
    console.error("[vercel api handler]", e);
    const message = e instanceof Error ? e.message : String(e);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
}
