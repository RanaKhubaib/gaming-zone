# Gaming Zone Manager

Full-stack app for running a PlayStation / PC gaming café: stations, sessions, automatic duration & price, optional live Start/Stop timer, and reports.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Prisma · **PostgreSQL** (Neon / Prisma Postgres — Vercel-ready)

---

## Requirements

- [Node.js](https://nodejs.org) LTS (v18+)
- A PostgreSQL database (Neon free tier, Prisma Postgres, or Supabase)

## Install & run

1. Copy `.env.example` to `.env` and set:
   - `DATABASE_URL` — pooled connection string
   - `DIRECT_URL` — direct connection string (same as DATABASE_URL is OK for Prisma Postgres)
   - `AUTH_SECRET` — long random string
2. Install and migrate:

```bash
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Login

- Username: `admin`
- Password: `admin123`  
Change these under **Settings → Account**.

## Pricing (Settings → Timer & pricing)

| Setting | Default | Meaning |
|--------|---------|---------|
| Station hourly rate | set on **Stations** (e.g. ₨300) | Price per hour for that console |
| Minimum billable hours | `1` | Never charge less than 1 × hourly rate |
| Round up to full hours | **On** | 1h 05m → 2 hours |
| Show live running price on timer | **Off** | Timer shows rate/min instead of ticking cost |

Example with PS5 at ₨300/hr, min 1 hour, round up on: 20 minutes → **₨300**; 65 minutes → **₨600**.

## CSV backup

**Settings → Data backup & CSV**: download sessions, sample template, import CSV.  
Also **Sessions → Download CSV**.

## Deploy to Vercel

Follow the full guide: **[DEPLOY.md](./DEPLOY.md)** (Neon/Prisma DB → GitHub → Vercel env vars → login).

Summary: you need `DATABASE_URL`, `DIRECT_URL`, and `AUTH_SECRET` on Vercel. Logo uploads are stored in the database, so they work on Vercel.

## Daily use

1. Dashboard — sessions / optional timer  
2. Stations — set **hourly rate** per station (e.g. 300)  
3. Settings — pricing rules, branding, CSV, account  
4. Sessions / Reports — history and totals  
