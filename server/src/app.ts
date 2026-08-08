import path from "path";
import fs from "fs";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { api } from "./routes/api";

// Only load local .env files. On Vercel, platform env vars are already set.
if (!process.env.VERCEL) {
  const rootEnv = path.resolve(__dirname, "../../.env");
  if (fs.existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv, quiet: true });
  } else {
    dotenv.config({ quiet: true });
  }
}

export function createApp() {
  const app = express();
  const isProd = process.env.NODE_ENV === "production";

  app.use(
    cors({
      origin: isProd ? true : ["http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
    })
  );
  app.use(express.json({ limit: "3mb" }));
  app.use(cookieParser());

  // Vercel catch-all may pass path without the /api prefix
  if (process.env.VERCEL) {
    app.use((req, _res, next) => {
      const url = req.url || "/";
      if (!url.startsWith("/api")) {
        req.url = "/api" + (url.startsWith("/") ? url : `/${url}`);
      }
      next();
    });
  }

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api", api);

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error("[api error]", err);
      const message =
        err instanceof Error ? err.message : "Internal server error";
      if (!res.headersSent) {
        res.status(500).json({ error: message });
      }
    }
  );

  // On Vercel the static UI is served separately (client/dist).
  const clientDist = path.resolve(__dirname, "../../client/dist");
  if (isProd && fs.existsSync(clientDist) && !process.env.VERCEL) {
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  return app;
}

const app = createApp();
export default app;
