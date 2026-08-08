import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.session.deleteMany();
  await prisma.station.deleteMany();
  await prisma.game.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  await prisma.settings.create({
    data: {
      id: 1,
      liveTimerEnabled: false,
      showLiveRunningCost: false,
      minBillableHours: 1,
      roundUpToFullHours: true,
      shopName: "Gaming Zone",
      currencySymbol: "₨",
      currencyCode: "PKR",
      accentColor: "#0f766e",
      availableColor: "#059669",
      occupiedColor: "#dc2626",
      unpaidColor: "#d97706",
      paidColor: "#64748b",
      defaultCustomerName: "Walk-in",
    },
  });

  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      username: "admin",
      displayName: "Owner",
      passwordHash,
    },
  });

  await prisma.station.createMany({
    data: [
      { name: "PS5 - Station 1", consoleType: "PS5", hourlyRate: 300 },
      { name: "PS5 - Station 2", consoleType: "PS5", hourlyRate: 300 },
      { name: "PS4 - Station 1", consoleType: "PS4", hourlyRate: 200 },
      { name: "PC - Station 1", consoleType: "PC", hourlyRate: 150 },
      { name: "PC - Station 2", consoleType: "PC", hourlyRate: 150 },
    ],
  });

  await prisma.game.createMany({
    data: [
      { name: "FIFA" },
      { name: "Call of Duty" },
      { name: "GTA V" },
      { name: "Fortnite" },
      { name: "Tekken" },
      { name: "Valorant" },
      { name: "Minecraft" },
    ],
  });

  console.log("Database seeded.");
  console.log("Default login → username: admin  password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
