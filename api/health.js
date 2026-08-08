/**
 * Simple health check — does NOT load Express/Prisma.
 * Open https://YOUR-APP.vercel.app/api/health after deploy.
 */
module.exports = function health(_req, res) {
  res.status(200).json({
    ok: true,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasDirectUrl: Boolean(process.env.DIRECT_URL),
    hasAuthSecret: Boolean(
      process.env.AUTH_SECRET && String(process.env.AUTH_SECRET).length >= 16
    ),
  });
};
