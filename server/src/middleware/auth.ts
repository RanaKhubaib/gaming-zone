import type { Request, Response, NextFunction } from "express";
import { getSessionFromRequest } from "../lib/auth";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as Request & { user: typeof session }).user = session;
  next();
}
