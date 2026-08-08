import path from "path";
import fs from "fs";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { api } from "./routes/api";

const rootEnv = path.resolve(__dirname, "../../.env");
if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
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

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api", api);

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
