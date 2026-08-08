const { execSync } = require("child_process");
const path = require("path");

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
    "ERROR: DATABASE_URL is missing during build. Add it in Vercel → Settings → Environment Variables (Production), then redeploy."
  );
  process.exit(1);
}

run("npx prisma generate", root);
try {
  run("npx prisma generate --schema=../prisma/schema.prisma", server);
} catch (e) {
  console.warn("server prisma generate skipped/failed (using root client)");
}
run("npx prisma migrate deploy", root);
run("node ../scripts/build-server.js", server);
run("npm run build", path.join(root, "client"));
run("node scripts/copy-client-to-public.js", root);

console.log("\nvercel-build OK");
