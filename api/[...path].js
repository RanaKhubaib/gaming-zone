/**
 * Temporary minimal catch-all to verify Vercel invokes api/[...path].js
 */
module.exports = async function handler(req, res) {
  res.status(200).json({
    ok: true,
    via: "minimal-catchall",
    method: req.method,
    url: req.url,
    query: req.query,
  });
};
