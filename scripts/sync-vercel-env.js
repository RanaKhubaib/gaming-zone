const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

function parseEnv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function withQueryParams(url, params) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) {
    if (!u.searchParams.has(k)) u.searchParams.set(k, v);
  }
  return u.toString();
}

const root = path.join(__dirname, "..");
const env = parseEnv(path.join(root, ".env"));

const databaseUrl = withQueryParams(env.DATABASE_URL, {
  sslmode: "require",
  pgbouncer: "true",
  connect_timeout: "10",
});
const directUrl = withQueryParams(env.DIRECT_URL, {
  sslmode: "require",
  connect_timeout: "10",
});
const authSecret = env.AUTH_SECRET;

if (!databaseUrl || !directUrl || !authSecret) {
  console.error("Missing DATABASE_URL, DIRECT_URL, or AUTH_SECRET in .env");
  process.exit(1);
}

function setEnv(name, value, environment) {
  console.log(`Setting ${name} (${environment})...`);
  try {
    execFileSync(
      "npx",
      ["vercel", "env", "rm", name, environment, "--yes"],
      { cwd: root, stdio: "pipe", shell: true }
    );
  } catch {
    // ignore if missing
  }
  execFileSync(
    "npx",
    ["vercel", "env", "add", name, environment, "--sensitive", "--yes"],
    {
      cwd: root,
      input: value + "\n",
      stdio: ["pipe", "inherit", "inherit"],
      shell: true,
    }
  );
}

for (const environment of ["production", "preview"]) {
  setEnv("DATABASE_URL", databaseUrl, environment);
  setEnv("DIRECT_URL", directUrl, environment);
  setEnv("AUTH_SECRET", authSecret, environment);
}

console.log("Vercel env vars synced from local .env");
