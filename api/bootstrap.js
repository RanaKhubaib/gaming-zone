/**
 * Standalone bootstrap probe using Neon HTTP (no Express / Prisma engine).
 */
const { neon } = require("@neondatabase/serverless");

module.exports = async function bootstrap(_req, res) {
  try {
    if (!process.env.DATABASE_URL) {
      res.status(500).json({ error: "DATABASE_URL missing" });
      return;
    }
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT id, "shopName", "liveTimerEnabled", "currencySymbol"
      FROM "Settings"
      WHERE id = 1
      LIMIT 1
    `;
    const settings = rows[0] || null;
    res.status(200).json({
      ok: true,
      via: "neon-http",
      settings,
      user: null,
    });
  } catch (e) {
    console.error("[api/bootstrap]", e);
    res.status(500).json({
      error: e && e.message ? e.message : String(e),
    });
  }
};
