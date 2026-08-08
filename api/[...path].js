module.exports = async function handler(req, res) {
  const steps = [];
  try {
    steps.push("start");
    require("@prisma/client");
    steps.push("prisma-client");
    require("express");
    steps.push("express");
    require("serverless-http");
    steps.push("serverless-http");
    require("jose");
    steps.push("jose");
    require("bcryptjs");
    steps.push("bcryptjs");
    require("date-fns");
    steps.push("date-fns");
    require("@neondatabase/serverless");
    steps.push("neon");
    require("@prisma/adapter-neon");
    steps.push("adapter-neon");
    require("ws");
    steps.push("ws");
    require("../server/dist/lib/auth-constants");
    steps.push("auth-constants");
    require("../server/dist/lib/config");
    steps.push("config");
    require("../server/dist/lib/prisma");
    steps.push("prisma-module");
    require("../server/dist/app");
    steps.push("app");
    res.status(200).json({ ok: true, steps });
  } catch (e) {
    res.status(500).json({
      error: e && e.message ? e.message : String(e),
      steps,
    });
  }
};
