const fs = require("fs");
const path = require("path");

function rimraf(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    // Keep existing public samples if any, but we replace app assets
    fs.rmSync(full, { recursive: true, force: true });
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

const root = path.join(__dirname, "..");
const dist = path.join(root, "client", "dist");
const pub = path.join(root, "public");

if (!fs.existsSync(dist)) {
  console.error("client/dist missing — Vite build failed?");
  process.exit(1);
}

fs.mkdirSync(pub, { recursive: true });
// Clear previous SPA files but keep folder
for (const name of fs.readdirSync(pub)) {
  if (name === "samples") continue; // optional keep
  fs.rmSync(path.join(pub, name), { recursive: true, force: true });
}
copyDir(dist, pub);
console.log("Copied client/dist → public/");
