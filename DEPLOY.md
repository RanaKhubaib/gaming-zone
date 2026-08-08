# Deploy on Vercel (Vite + Express)

## Before you create the project
1. Have your local `.env` ready with:
   - `DATABASE_URL` (Neon pooled / `-pooler`)
   - `DIRECT_URL` (Neon direct)
   - `AUTH_SECRET` (16+ characters)
2. Do **not** import secrets like old Prisma `CLAIM_URL` (not needed).

## Create the Vercel project
1. Delete the old Gaming Zone project on Vercel (optional cleanup).
2. [vercel.com/new](https://vercel.com/new) → Import `RanaKhubaib/gaming-zone`.
3. **Environment Variables** → **Import .env** (or paste the 3 vars) → apply to Production + Preview.
4. Framework: leave default / Other. Root: `.`
5. Deploy.

## After deploy
1. Open `https://YOUR-APP.vercel.app/api/health`  
   You should see `"ok": true` and all `has*` flags `true`.
2. Open the site → login `admin` / `admin123`.
3. If login fails, run once on your PC (Neon URLs in `.env`):

```powershell
npx prisma db seed
```

## Local
```powershell
npm run dev
```
- UI http://localhost:5173  
- API http://localhost:4000  
