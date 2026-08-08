# Deploy Gaming Zone (Vite + React + Express) on Vercel

## 1. Push code to GitHub
Repo: `RanaKhubaib/gaming-zone`.

## 2. Open Vercel project
1. Go to [https://vercel.com](https://vercel.com) → your **gaming-zone** project  
   (or **Add New → Project** → import `RanaKhubaib/gaming-zone`).
2. Framework: **Other** (or Vite if detected).
3. Root directory: `.` (repo root).

## 3. Environment variables
In **Settings → Environment Variables**, set for Production + Preview:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon **pooled** connection string |
| `DIRECT_URL` | Neon **direct** connection string |
| `AUTH_SECRET` | Long random secret (16+ characters) |

Use the same Neon values as in your local `.env`.

## 4. Deploy
Click **Deploy** (or push to `main` — Vercel redeploys automatically).

Build runs Prisma migrate + Vite build. API is served at `/api/*`.

## 5. After first deploy
If login fails (no admin user), run once on your PC with Neon URLs in `.env`:

```powershell
npx prisma db seed
```

Then open your `*.vercel.app` URL → login `admin` / `admin123` → change password.

## Local vs Vercel
| | Local | Vercel |
|--|--------|--------|
| UI | http://localhost:5173 | your vercel URL |
| API | http://localhost:4000/api | same domain `/api` |
