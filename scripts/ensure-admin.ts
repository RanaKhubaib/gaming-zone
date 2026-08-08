import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { username: "admin" } });
  if (existing) {
    console.log("Admin user already exists.");
    return;
  }
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      username: "admin",
      displayName: "Owner",
      passwordHash,
    },
  });
  console.log("Created admin user (password: admin123)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
