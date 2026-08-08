# Gaming Zone — Vite + React + Express

**Stack:** Vite · React · Express · Prisma · Neon PostgreSQL

## Local development

1. `.env` must have `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`
2. Install:

```bash
npm install
npm install --prefix server
npm install --prefix client
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

- Web UI: http://localhost:5173  
- API: http://localhost:4000  

Login: `admin` / `admin123`

## Production (recommended: Railway / Render)

Vercel’s free hosting fits Next.js best. This Vite+Express app should be one Node service:

1. Build: `npm run build` (builds client into `client/dist`, server uses it)
2. Start: `NODE_ENV=production npm start` (Express serves API + static UI)
3. Set env vars: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `PORT`

Push to GitHub → connect Railway/Render → deploy.

## Git push (updates live host)

```powershell
git add .
git commit -m "Your message"
git push
```
