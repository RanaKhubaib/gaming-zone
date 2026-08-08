const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

const serverRoot = path.join(__dirname, "..", "server");
const distDir = path.join(serverRoot, "dist");

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

// Bundle the Express app for Vercel (no typecheck — avoids Prisma type issues on CI)
esbuild.buildSync({
  entryPoints: [path.join(serverRoot, "src", "app.ts")],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: path.join(distDir, "app.js"),
  // Keep Prisma external so the query engine files load from node_modules
  external: ["@prisma/client", ".prisma/client"],
  logLevel: "info",
});

// Local server entry (optional; used by npm start)
esbuild.buildSync({
  entryPoints: [path.join(serverRoot, "src", "index.ts")],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: path.join(distDir, "index.js"),
  external: ["@prisma/client", ".prisma/client"],
  logLevel: "info",
});

console.log("server dist built with esbuild");
