/**
 * Vercel serverless entry — Express app is a valid (req, res) listener.
 * Do NOT wrap with serverless-http; that breaks routing on Vercel.
 */
const appModule = require("../server/dist/app");
const app = appModule.default || appModule;

module.exports = app;
