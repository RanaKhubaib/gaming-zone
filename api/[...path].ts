import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../server/src/app";

/** Catch-all so /api/bootstrap, /api/dashboard, etc. all hit Express. */
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as never, res as never);
}
