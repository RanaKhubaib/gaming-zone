const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

const serverRoot = path.join(__dirname, "..", "server");
const srcDir = path.join(serverRoot, "src");
const distDir = path.join(serverRoot, "dist");

function listTsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTsFiles(full));
    else if (entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

const entryPoints = listTsFiles(srcDir);
if (entryPoints.length === 0) {
  console.error("No TypeScript files found in server/src");
  process.exit(1);
}

// Transpile only (no bundle) so @prisma/client resolves from node_modules at runtime
esbuild.buildSync({
  entryPoints,
  outdir: distDir,
  outbase: srcDir,
  platform: "node",
  target: "node18",
  format: "cjs",
  bundle: false,
  logLevel: "info",
});

console.log(`server dist built (${entryPoints.length} files, unbundled)`);
