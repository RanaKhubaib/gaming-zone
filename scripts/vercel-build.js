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

run("npx prisma generate", root);
run("npx prisma generate --schema=../prisma/schema.prisma", server);
run("npx prisma migrate deploy", root);
run("npm run build", server);
run("npm run build", path.join(root, "client"));
run("node scripts/copy-client-to-public.js", root);

console.log("\nvercel-build OK");
