module.exports = async function handler(req, res) {
  try {
    console.log("[api] start", req.url);
    // Probe: does loading Prisma Client hang on Vercel?
    const { PrismaClient } = require("@prisma/client");
    console.log("[api] PrismaClient loaded");
    res.status(200).json({
      ok: true,
      via: "prisma-load-probe",
      hasPrisma: typeof PrismaClient === "function",
    });
  } catch (e) {
    console.error("[api] prisma load failed", e);
    res.status(500).json({ error: e && e.message ? e.message : String(e) });
  }
};
