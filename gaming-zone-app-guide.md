# Gaming Zone Management App — Full Guide

This document is everything you need:
1. What the app will do (in plain English)
2. Step-by-step setup instructions (total beginner friendly)
3. The exact prompt to paste into Cursor to build the app
4. Follow-up prompts for common changes/additions
5. How to run and use the finished app daily

---

## 1. What the App Will Do

Right now, for every customer you manually write down: game name, customer name, play duration, price, and which console (PS4/PS5/etc) they used.

The new app will let you:

- **Add a station list once** (e.g., "PS5 - Station 1", "PS5 - Station 2", "PS4 - Station 1", "PC - Station 1"). You set this up one time, not daily.
- **Set hourly rates once** per console type (e.g., PS5 = 300/hr, PS4 = 200/hr, PC = 150/hr). Editable anytime.
- **Add a session manually**: pick a station, type the customer's name, pick the game, and type in the start time and end time (or just the duration) yourself. The app then **automatically calculates the price** for you (duration × hourly rate) — so you still stop manually typing prices and doing math, but you stay in control of the time entry.
- **Optional live timer (off by default)**: a Start/Stop timer feature will also be built in, but kept switched off until you decide you want it. You can flip it on later from a settings toggle whenever you're ready — no need to rebuild anything.
- **See all stations at a glance** on a dashboard (who's playing where, what they're playing, and today's totals).
- **Automatic daily record**: every finished session is saved to a database automatically — you don't type it in separately.
- **Reports**: total earnings today, this week, this month; most-played games; busiest stations; per-customer history — all generated automatically from your saved sessions.
- **Manual override**: you can still edit a session (e.g., if you forgot to click stop, or want to add a manual discount) — automation replaces re-typing, not your control.

### Core Data You're Tracking (Database Tables)
- **Stations**: id, name, console type (PS4/PS5/PC/Xbox/etc), hourly rate, status (available/occupied)
- **Sessions**: id, station id, customer name, game name, start time, end time, duration (auto-calculated from start/end), price (auto-calculated), payment status (paid/unpaid), entry mode (manual or timer), notes
- **Games** (optional list so you can pick from a dropdown instead of retyping names): id, name
- **Settings**: a single row/toggle for whether the live timer feature is enabled (default: off)
- **Daily Summary** (auto-generated, not manually entered): date, total sessions, total revenue

---

## 2. Recommended Tools (Beginner-Friendly)

- **Cursor** — the AI code editor you'll use to build this (you likely have it already)
- **Node.js** — required to run the app. Download from https://nodejs.org (choose the "LTS" version)
- **Next.js + TypeScript + Prisma + SQLite** — the tech stack Cursor will build for you:
  - Next.js = the web app framework (handles both the pages you see and the backend logic)
  - Prisma = makes talking to the database easy and safe
  - SQLite = the database itself — it's just a single file on your computer, no server or account setup needed to get started
- **Git** (optional but recommended) — lets you save versions of your project as you go. Download from https://git-scm.com

You do **not** need to know how to code. Cursor will write the code; you just need to follow the steps below and know how to describe what you want changed.

---

## 3. Step-by-Step Setup (Do This Before Opening Cursor)

### Step 1: Install Node.js
1. Go to https://nodejs.org
2. Download the **LTS** version for your OS (Windows/Mac)
3. Run the installer, click Next through all steps (defaults are fine)
4. Verify it worked: open a terminal (Command Prompt on Windows, Terminal on Mac) and type:
   ```
   node -v
   ```
   You should see a version number like `v20.x.x`. If you see an error, restart your computer and try again.

### Step 2: Install Cursor
1. Go to https://cursor.com and download it for your OS
2. Install and open it

### Step 3: Create Your Project Folder
1. On your Desktop (or wherever you like), create a new folder called `gaming-zone-app`
2. Open Cursor
3. In Cursor, go to **File > Open Folder** and select the `gaming-zone-app` folder you just made

### Step 4: Open Cursor's AI Chat / Composer
1. In Cursor, open the chat/composer panel (usually a sidebar icon, or `Ctrl+L` / `Cmd+L`)
2. Make sure you're using **Agent mode** (sometimes called "Composer" or "Agent") — this lets Cursor create files and run terminal commands for you, not just chat
3. Paste the full prompt from **Section 4 below** into the chat and send it

### Step 5: Let Cursor Build
- Cursor will create files, install packages, and set up the database. This can take a few minutes.
- If it asks permission to run terminal commands, approve them (that's normal and expected — it's installing packages and setting up the database).
- If Cursor says it finished, ask it to run the app (see Step 6).

### Step 6: Run the App
1. Open a terminal inside Cursor (Terminal menu > New Terminal)
2. Type:
   ```
   npm run dev
   ```
3. Open your browser and go to: `http://localhost:3000`
4. You should see your app running.

### Step 7: Test It
Use the checklist in **Section 6** below to make sure everything works before you trust it with real shop data.

---

## 4. The Cursor Prompt (Copy Everything Below and Paste Into Cursor)

```
I want you to build a full-stack web app for managing my gaming zone shop (like a PlayStation/PC gaming café). Build it using Next.js (App Router) with TypeScript, Tailwind CSS for styling, Prisma as the ORM, and SQLite as the database (file-based, no external DB server needed). Set up the whole project from scratch in this folder.

## Purpose
I currently track customers, games, play duration, price, and which gaming console/station they used by hand on paper. Replace this with an app where I click "Start" and "Stop" on a timer per station, and the app automatically calculates duration and price and saves it to a database — I should almost never need to type numbers by hand.

## Database Schema (using Prisma)
Create these models:

1. Station
   - id
   - name (e.g., "PS5 - Station 1")
   - consoleType (enum or string: PS4, PS5, XBOX, PC, OTHER)
   - hourlyRate (number, currency amount per hour, editable)
   - status (AVAILABLE or OCCUPIED)
   - createdAt

2. Game
   - id
   - name (unique)

3. Session
   - id
   - stationId (relation to Station)
   - customerName (string)
   - gameId (optional relation to Game, nullable — allow free text too if not in list)
   - gameNameFreeText (optional string, in case they don't pick from the list)
   - startTime (datetime)
   - endTime (datetime, nullable until session ends)
   - durationMinutes (number, auto-calculated from startTime and endTime whenever either is set/changed)
   - price (number, auto-calculated = durationMinutes/60 * station hourlyRate at time of session, recalculated automatically any time the time fields change)
   - entryMode (MANUAL or TIMER — default MANUAL)
   - paymentStatus (PAID or UNPAID, default UNPAID)
   - notes (optional string)
   - createdAt

4. Settings
   - id (single row, e.g. id = 1)
   - liveTimerEnabled (boolean, default false)

## Pages / Features to Build

### 1. Dashboard (home page "/")
- Show all stations as cards in a grid.
- Each card shows: station name, console type, and status (Available = green / Occupied = red).
- **Default mode is MANUAL entry.** On any station card, an "Add Session" button opens a form with:
  - Customer name (required)
  - Game (dropdown of existing games + option to type a new one)
  - Start time (date + time picker, defaults to "now" but fully editable)
  - End time (date + time picker, optional — can be left blank if the customer is still playing; can be filled in later from the Sessions page)
  - As soon as both start time and end time are filled in (whether typed now or edited later), the app automatically calculates duration and price — you never type the duration or price yourself.
  - If end time is left blank, the station shows status "Occupied" until an end time is added (either by editing the session or, if the timer is enabled, by pressing "Stop").
- **Optional live timer (hidden by default):** Include a Settings page ("/settings") with a single toggle "Enable live Start/Stop timer". When this toggle is ON:
  - Available station cards additionally show a "Start Timer" button that immediately creates a session with startTime = now and entryMode = TIMER, no form needed.
  - Occupied stations created via the timer show a live running clock (updating every second) and running cost, plus a "Stop Timer" button that sets endTime = now and calculates the final price.
  - When the toggle is OFF (the default), these timer buttons are hidden completely and every station only shows "Add Session" (manual form) as described above.
- Show today's total revenue and today's total sessions count at the top of the dashboard, auto-calculated from the database (don't hardcode).

### 2. Stations management page ("/stations")
- List, add, edit, and delete stations (name, console type, hourly rate).
- Prevent deleting a station that currently has an active session.

### 3. Games management page ("/games")
- Simple list to add/edit/delete games, so they show up in the dropdown when starting a session.

### 4. Sessions / History page ("/sessions")
- Table of all past sessions (completed and active), newest first.
- Columns: date, station, customer, game, duration, price, payment status.
- Filters: by date range, by station, by payment status (paid/unpaid).
- Allow marking an unpaid session as paid.
- Allow manually editing a session at any time — changing the start time, end time, customer name, or game. Any change to start/end time must instantly recalculate duration and price automatically.
- This page should also be where I fill in an end time for a session that was started but left blank (i.e., finish logging a session after the fact).
- Allow deleting a session (with a confirmation prompt).

### 5. Reports page ("/reports")
- Total revenue and total sessions for: today, this week, this month (auto-calculated, not manual).
- A simple bar or line chart of daily revenue for the last 30 days.
- Top 5 most-played games (by number of sessions).
- Busiest stations (by total hours booked).
- All of this should be calculated live from the Session table, not stored separately.

### 6. Settings page ("/settings")
- A single toggle: "Enable live Start/Stop timer" (default OFF), saved to the Settings table.
- A short explanatory note under the toggle: "When off, add sessions manually with your own start/end time. When on, stations also get a live Start/Stop timer button."
- Room to add more settings later (e.g., currency symbol, shop name).

## Design / UX requirements
- Clean, modern, simple UI using Tailwind CSS — this will be used on a shop computer/tablet, so buttons should be large and easy to tap, text should be easy to read at a glance.
- Use a clear color system: green = available, red = occupied, gray = paid, yellow/orange = unpaid.
- Include a persistent top navigation bar with links: Dashboard, Stations, Games, Sessions, Reports, Settings.
- Currency: use PKR (₨) as the default currency symbol, but make it easy to change later (store the symbol in one config location).
- Times should be shown in a friendly format (e.g., "1h 23m" not raw minutes).

## Technical requirements
- Use Prisma with SQLite (file at prisma/dev.db). Set up the schema, run the migration, and seed the database with 4-5 example stations (mix of PS4/PS5/PC) and a handful of common games (e.g., FIFA, Call of Duty, GTA V, Fortnite, Tekken) so I have sample data to test with immediately.
- Use Next.js Server Actions or API routes for all database writes (starting/stopping sessions, editing, deleting) — no client-side-only fake state, everything must persist to the SQLite database.
- Make sure the live running timer on the dashboard updates every second on the client without needing a full page refresh.
- Add basic form validation (e.g., customer name required to start a session).
- Set up the project so I can run it locally with `npm install` then `npm run dev`.
- Add a README.md explaining how to install, run, back up the database file, and reset/reseed the database if needed.

## What to do when finished
1. Run the Prisma migration and seed the database.
2. Start the dev server and confirm the app loads without errors.
3. Give me a short summary of what you built and any manual step I still need to do.

Please set up the entire project now, including installing all necessary packages.
```

---

## 5. Follow-Up Prompts (Use These Later, One at a Time)

Once the base app works, you can ask Cursor for improvements. Paste these into Cursor's chat one at a time, only after testing the previous change:

- **Turn on the live timer whenever you're ready**: this doesn't need a Cursor prompt at all — just flip the toggle on the "/settings" page inside the app itself.

- **Add login/password protection** (so random people can't open your shop dashboard):
  > "Add a simple login page with a single shared password stored in an environment variable, and protect all pages behind it using Next.js middleware."

- **Add printable receipts**:
  > "Add a 'Print Receipt' button on completed sessions that opens a clean, printable receipt view with shop name, customer name, game, duration, and price."

- **Add discounts/manual price override**:
  > "When stopping a session, let me optionally apply a discount percentage or set a manual final price instead of the auto-calculated one, and store both the calculated and final price."

- **Move to the cloud so you can check it from your phone**: see the full walkthrough in **Section 8: Deploying to Vercel** below — it covers switching the database and going live in detail.

- **Add multiple staff logins**:
  > "Add a Staff table with name and PIN code, require selecting a staff member before starting a session, and track which staff member handled each session in the Sessions table."

- **WhatsApp/SMS reminders for regulars**: only pursue this once the core app is stable — it adds real complexity (needs a messaging API/account).

---

## 6. Testing Checklist (Do This Before Using It for Real Shop Data)

- [ ] App loads at `http://localhost:3000` with no errors
- [ ] Dashboard shows sample stations from the seed data
- [ ] Timer toggle in "/settings" is OFF by default, and no Start/Stop timer buttons appear anywhere while it's off
- [ ] Clicking "Add Session" on a station lets you type customer name, game, start time, and end time manually
- [ ] After entering start + end time, duration and price are calculated automatically and correctly (duration × hourly rate)
- [ ] Leaving end time blank saves the session as "Occupied" until you fill it in later
- [ ] The session appears correctly in the Sessions/History page
- [ ] Editing a session's start/end time recalculates duration and price correctly
- [ ] Marking a session "Paid" updates correctly
- [ ] Turning the timer toggle ON in "/settings" makes Start/Stop timer buttons appear on stations
- [ ] With the timer ON: "Start Timer" creates a live session, the running clock/cost update every second, and "Stop Timer" saves the correct final duration and price
- [ ] Turning the timer toggle back OFF hides the timer buttons again without breaking anything
- [ ] Reports page shows correct totals matching what you'd expect from your test sessions
- [ ] Adding a new station in "/stations" appears immediately on the dashboard
- [ ] Adding a new game in "/games" appears in the dropdown when adding a new session
- [ ] Restarting the app (`npm run dev` again) does NOT lose previously saved sessions (this confirms the database is actually persisting data, not just holding it in memory)

---

## 7. Making It Easy to Open and Close Daily

Typing `npm run dev` and a URL every morning gets old fast. Here are three options, from quickest to most polished. You don't have to pick now — Option A takes 5 minutes and is enough for most shops.

### Option A: A "double-click to start" shortcut (recommended to start with)

This creates one file you double-click to launch the app and open it in your browser automatically. To stop it, you just close the window it opens.

**On Windows:**
1. In your project folder, create a new text file named `start-app.bat`
2. Put this inside it:
   ```
   @echo off
   cd /d "%~dp0"
   start http://localhost:3000
   npm run dev
   ```
3. Right-click `start-app.bat` > **Send to > Desktop (create shortcut)**
4. (Optional) Right-click the desktop shortcut > Properties > change the icon to something recognizable, like a controller icon image
5. Every morning: double-click the shortcut. A black terminal window opens (this is normal — it's running the app) and your browser opens the app automatically.
6. To stop: just close the black terminal window.

**On Mac:**
1. In your project folder, create a new text file named `start-app.command`
2. Put this inside it:
   ```
   #!/bin/bash
   cd "$(dirname "$0")"
   open http://localhost:3000
   npm run dev
   ```
3. Open Terminal, run this once to make it clickable:
   ```
   chmod +x /path/to/your/project/start-app.command
   ```
   (replace with your actual folder path)
4. Drag `start-app.command` to your Desktop or Dock as a shortcut
5. Every morning: double-click it. A Terminal window opens (normal) and your browser opens the app.
6. To stop: close the Terminal window.

You can literally ask Cursor to create this file for you instead of typing it yourself — just say: *"Create a start-app.bat (Windows) and start-app.command (Mac) file that runs npm run dev and opens http://localhost:3000 in the browser automatically."*

### Option B: Have it start automatically when your laptop turns on

If you want it running in the background all day without even clicking the shortcut:
- **Windows**: put a shortcut to `start-app.bat` in the Startup folder (press `Win + R`, type `shell:startup`, hit Enter, drop the shortcut there).
- **Mac**: System Settings > General > Login Items > add `start-app.command`.

Then you just open your browser and go to `http://localhost:3000` (bookmark it) whenever you need it — no double-clicking required, and it survives you closing/reopening the browser.

### Option C (later, optional): Turn it into a real desktop app icon

If down the road you want zero terminal windows and zero browser address bar — just a proper app icon like any other program — you can ask Cursor to wrap the app with **Electron** or **Tauri**, which packages it as a real `.exe`/`.app` you double-click, with its own window, no visible terminal, and it can even auto-launch on startup. This is a bigger step and worth doing only once the core app has been running smoothly for a while. A prompt for that later:
> "Package this Next.js app as a desktop app using Electron, so it opens as a standalone window with an app icon on Windows, with no visible terminal or browser needed. Include a build script that produces an installer."

### Daily Routine Once Set Up
1. Double-click your shortcut (or it's already running if you used Option B).
2. Use the app in your browser tab all day.
3. Close the terminal window (or just leave your laptop on) when done — your data is safely saved in `prisma/dev.db` either way.
4. Periodically back up `prisma/dev.db` by copying it somewhere safe (a USB drive or cloud folder like Google Drive).

---

## 8. Deploying to Vercel (Optional — Always-On, Access From Anywhere)

If instead of running it on one laptop you'd rather have it always available at a web link (from your phone, a shop tablet, another computer, etc.), you can deploy it to **Vercel** (a free hosting service made by the creators of Next.js — deployment is very smooth since your app is already built with Next.js).

### Important: You must switch databases first
SQLite (the single `.db` file approach used in the local version) does **not** work reliably on Vercel, because Vercel's servers don't keep a permanent hard drive — the file gets wiped and your data would randomly vanish. Before deploying, you need to switch to a proper hosted database. **Neon** and **Supabase** both offer a free Postgres database that's more than enough for a shop this size.

You should also add basic password protection before putting it on a public link, since anyone with the URL could otherwise open your dashboard.

### Prompt to give Cursor for this (do this as one combined step)
```
I want to deploy this app to Vercel. Before that, please:

1. Switch the database from SQLite to Postgres, using an environment variable DATABASE_URL for the connection string (I will get this from Neon or Supabase and paste it in — don't hardcode any credentials).
2. Update the Prisma schema's datasource provider to "postgresql" and regenerate the migration for Postgres.
3. Add simple password protection: a login page that checks a single shared password against an environment variable (e.g., SHOP_PASSWORD), using Next.js middleware to protect every page until logged in.
4. Add a README section explaining exactly what environment variables need to be set in Vercel (DATABASE_URL and SHOP_PASSWORD) and how to run the Postgres migration against the live database the first time.
5. Make sure the seed script (sample stations/games) still works against Postgres, but don't run it automatically in production — only locally when I ask.

Confirm when done and tell me exactly what I need to paste into Vercel's dashboard.
```

### Steps to actually go live (after Cursor makes the code changes above)
1. **Create a free database**: sign up at https://neon.tech (or https://supabase.com), create a new project, and copy the "connection string" it gives you — this is your `DATABASE_URL`.
2. **Put your code on GitHub**: create a free GitHub account if you don't have one, create a new repository, and push your project to it (ask Cursor: *"help me push this project to a new GitHub repository"* if you're not familiar with Git).
3. **Import into Vercel**: sign up at https://vercel.com (you can sign in with your GitHub account), click "Add New Project," and select your repository.
4. **Add environment variables**: in Vercel's project settings, add:
   - `DATABASE_URL` = the connection string from Neon/Supabase
   - `SHOP_PASSWORD` = a password you choose for logging into your shop dashboard
5. **Deploy**: Vercel will build and deploy automatically. It gives you a live URL like `your-project.vercel.app`.
6. **Run the migration on the live database once**: Cursor's README (from the prompt above) will tell you the exact command — usually something like running `npx prisma migrate deploy` pointed at your live `DATABASE_URL`.
7. Open your live URL, log in with your `SHOP_PASSWORD`, and test it exactly like the checklist in Section 6, using the real live link this time.

### After that, your daily routine becomes:
- Open your browser, go to your bookmarked `your-project.vercel.app` link (or add it to your phone's home screen so it looks like an app icon), log in once, and use it — no laptop, no terminal, no shortcuts needed.
- Any updates you ask Cursor to make later: just push the code changes to GitHub again and Vercel automatically redeploys.

### Is it worth it right now?
Not necessarily on day one. It's a good idea to first build and test the **local version** (Sections 3–7) with a few real days of shop data, make sure the features and pricing logic are exactly right, and only then move to Vercel once you're confident in the app. Migrating later is easy — you don't lose anything by starting local.

## 9. If Something Breaks


- Copy the exact error message Cursor or your terminal shows you.
- Paste it into Cursor's chat with: "I'm getting this error, please fix it: [paste error]"
- Cursor can usually fix its own errors quickly when given the exact message.
