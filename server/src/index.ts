import app from "./app";

const PORT = Number(process.env.PORT || 4000);

// Local / Railway / Render — listen on a port.
// On Vercel the app is exported as a serverless function (see /api/index.ts).
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

export default app;
