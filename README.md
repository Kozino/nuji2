# Nuji — Full-Stack Setup Guide

Your complete project: **React frontend (Vite)** + **Node/Express backend** with a JSON-file database (no database setup needed).

```
nuji/
├── package.json          # scripts + dependencies
├── vite.config.js        # dev server, proxies /api + /uploads to backend
├── index.html
├── public/assets/
│   ├── nuji-logo.png     # ← replace with your real logo
│   └── nuji12.png        # ← replace with your real illustration
├── src/
│   ├── main.jsx          # your whole app (you called it main.jsx 🙂) — now wired to the backend
│   ├── api.js            # small helper that calls the backend (falls back to demo data if server is off)
│   └── styles.css        # your stylesheet (GitHub-style activity graph included)
└── server/
    ├── server.js         # Express API (port 4000)
    ├── db.js             # JSON-file database + points/badges/streak logic
    ├── db.json           # created automatically on first run (seeded with demo users)
    └── uploads/          # voice recordings are saved here
```

---

## Requirements

- **Node.js 18 or newer** → https://nodejs.org (check with `node -v`)

## Steps to run (first time)

1. **Copy the `nuji` folder** to your computer (or copy these files into your existing project: `src/main.jsx`, `src/api.js`, `src/styles.css`, the whole `server/` folder, and `vite.config.js`).

2. **Install dependencies** (one time):
   ```bash
   cd nuji
   npm install
   ```

3. **Start the backend** — open a terminal and run:
   ```bash
   npm run server
   ```
   You should see: `✅ Nuji API running on http://localhost:4000`

4. **Start the frontend** — open a *second* terminal and run:
   ```bash
   npm run dev
   ```

5. **Open** http://localhost:5173 in your browser. 🎉

> Keep BOTH terminals open while developing. If the backend is off, the site still works with demo data (it just won't save anything).

## Using it with your EXISTING project

If you already have a Vite project:

1. Replace your `main.jsx` with `src/main.jsx` from this folder.
2. Add `src/api.js` next to it.
3. Replace `styles.css` with `src/styles.css`.
4. Copy the `server/` folder to your project root.
5. Install backend packages: `npm install express cors multer`
6. Add the `proxy` block from `vite.config.js` into your `vite.config.js`.
7. Run `npm run server` + `npm run dev` as above.

---

## What the backend does

| Endpoint | What it powers |
|---|---|
| `POST /api/auth/phone` | Join page — phone number is the login key (creates account) |
| `POST /api/profile` | Profile setup form (state, LGA, age, gender, languages) + referral codes |
| `GET /api/profile/:phone` | Profile page — points, rank, level, overview, breakdown, activity grid, badges, invite link |
| `POST /api/contributions` | Contribute page — saves text and/or **real voice recording** (uploaded to `server/uploads/`), awards points |
| `GET /api/clips?language=` | Listen page — serves a real recording waiting for review |
| `POST /api/reviews` | Listen page — saves yes/no decision, +1 point |
| `GET /api/leaderboard` | Leaderboard page — live ranking from the database |
| `GET /api/states` | State vs State page — live aggregation by state & zone |

**Points rules** (in `server/db.js`): text +3 · voice +5 · both +8 · code-switch mix +3 · review +1 · referral +10.

**Badges, levels, streaks and the GitHub-style activity grid** are all calculated by the backend from real data.

## Try the full flow

1. Go to **Contribute** → enter a phone number → create a profile.
2. Type a response and/or tap the mic and **actually speak** (uses your microphone) → submit → points appear.
3. Open **Profile** → your points, overview, activity square and badges update live.
4. Open **Leaderboard** and **State vs State** → you appear in the rankings.
5. Your voice recording becomes a review clip on the **Listen** page for other users.

## Going to production

- **Frontend**: deploy to Vercel/Netlify as you already do (`npm run build`).
- **Backend**: deploy `server/` to Render/Railway/Fly.io (it's a plain Node server). Set the `PORT` env var. Change `BASE` in `src/api.js` to your backend URL (e.g. `https://api.nuji.ng`).
- The JSON database is perfect for testing and small scale. For thousands of users, swap `db.js` storage for MongoDB/Postgres later — the API routes stay the same.
