# Deploy Gaming Zone to Vercel (step by step)

This app needs a **cloud PostgreSQL** database (Neon or claimed Prisma Postgres). Vercel cannot keep a local SQLite file.

---

## Part A — Prepare the database (do this first)

### Option 1: Neon (recommended, free)

1. Open [https://console.neon.tech](https://console.neon.tech) and sign up / log in.
2. Click **Create project** → name it e.g. `gaming-zone`.
3. When the project opens, click **Connect**.
4. Copy **two** connection strings:
   - **Pooled connection** → you will use as `DATABASE_URL`
   - **Direct connection** → you will use as `DIRECT_URL`
5. Keep that page open for Part C.

### Option 2: Claim the temporary Prisma Postgres already in your `.env`

1. Open the `CLAIM_URL` from your project `.env` in a browser  
   (or the claim link you were given when the DB was created).
2. Sign in with Prisma and **claim** the project so it does not expire.
3. Use the same connection string for both `DATABASE_URL` and `DIRECT_URL`.

---

## Part B — Put the code on GitHub

1. Create a GitHub account if you don’t have one: [https://github.com](https://github.com)
2. Create a **new repository** (e.g. `gaming-zone-software`), leave it empty.
3. In Cursor / VS Code terminal, inside your project folder:

```bash
git add .
git commit -m "Ready for Vercel deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gaming-zone-software.git
git push -u origin main
```

(Replace `YOUR_USERNAME` with your GitHub username.)

---

## Part C — Deploy on Vercel

1. Open [https://vercel.com](https://vercel.com) and sign in with **GitHub**.
2. Click **Add New… → Project**.
3. Import your `gaming-zone-software` repository.
4. Before deploying, open **Environment Variables** and add:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon **pooled** URL (or Prisma Postgres URL) |
| `DIRECT_URL` | Neon **direct** URL (or same as DATABASE_URL) |
| `AUTH_SECRET` | Any long random text, e.g. `my-shop-secret-928374` |

5. Apply variables to **Production**, **Preview**, and **Development**.
6. Click **Deploy**.
7. Wait until the build finishes (it runs `prisma migrate deploy` automatically).

---

## Part D — First login on the live site

1. Open the Vercel URL (e.g. `https://gaming-zone-software.vercel.app`).
2. Sign in with:
   - Username: `admin`
   - Password: `admin123`
3. Go to **Settings → Account** and change the password immediately.
4. Enable **live timer** in Settings if you want countdown Start/Stop on the dashboard.
5. Set each station’s **hourly rate** on the Stations page.

---

## Part E — If the database is empty after deploy

In your project folder (with Neon URLs in `.env`):

```bash
npx prisma migrate deploy
npx prisma db seed
```

That creates tables and the default admin user.

---

## Checklist

- [ ] Neon (or claimed Prisma) database created  
- [ ] Code pushed to GitHub  
- [ ] Vercel project linked to that repo  
- [ ] `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` set on Vercel  
- [ ] Deploy succeeded  
- [ ] Logged in and changed admin password  

If a step fails, copy the Vercel build error text and ask for help with that exact message.
