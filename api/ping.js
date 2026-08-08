/**
 * Lightweight probe — does NOT load Express/Prisma.
 */
module.exports = function ping(_req, res) {
  let dbHost = null;
  try {
    dbHost = process.env.DATABASE_URL
      ? new URL(process.env.DATABASE_URL).hostname
      : null;
  } catch {
    dbHost = "invalid-url";
  }
  res.status(200).json({
    ok: true,
    dbHost,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasAuthSecret: Boolean(
      process.env.AUTH_SECRET && String(process.env.AUTH_SECRET).length >= 16
    ),
  });
};
