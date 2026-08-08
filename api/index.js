/**
 * Main API entry for Vercel. All /api/* traffic (except health/ping)
 * is rewritten here via vercel.json.
 */
const appModule = require("../server/dist/app");
module.exports = appModule.default || appModule;
