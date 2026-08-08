const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

function run(cmd, cwd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, {
    cwd: cwd || path.join(__dirname, ".."),
    stdio: "inherit",
    env: process.env,
  });
}

const root = path.join(__dirname, "..");
const server = path.join(root, "server");

if (!process.env.DATABASE_URL) {
  console.error(
    "ERROR: DATABASE_URL is missing during build. Add it in Vercel env vars."
  );
  process.exit(1);
}

run("npx prisma generate", root);

const generated = path.join(
  root,
  "node_modules",
  ".prisma",
  "client",
  "index.js"
);
if (!fs.existsSync(generated)) {
  console.error("ERROR: Prisma client was not generated (.prisma/client missing)");
  process.exit(1);
}
console.log("Prisma client OK");

run("npx prisma migrate deploy", root);
run("node ../scripts/build-server.js", server);
run("npm run build", path.join(root, "client"));
run("node scripts/copy-client-to-public.js", root);

console.log("\nvercel-build OK");
