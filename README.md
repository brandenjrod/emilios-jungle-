# Emilio's Jungle 🐒

A tap-and-track baby app for two people, synced live via Supabase and installable on your phone's home screen.

**Four tabs:**
- 🌴 **Home** — one-tap logging for wet diapers, dirty diapers, and bottle feeds
- 📋 **Log** — full history in table form, with tap-to-edit timestamps for anything logged late
- 💚 **Emilio Joe** — live age counter, unlockable development milestones, an appointments/notes log, and a height & weight log
- 🖼️ **Gallery** — a shared photo board

Everything syncs in real time between whoever has the app open — no accounts, just the link.

## 1. Set up the Supabase backend

1. Go to [supabase.com](https://supabase.com) and create a free project (or use your existing one from before).
2. Open the **SQL Editor** and run everything in `supabase/schema.sql`. It's safe to run even if you already ran an earlier version — it adds the new tables (`appointments`, `growth_logs`, `photos`) and a `gallery` storage bucket without touching your existing diaper/feed data.
3. In **Storage**, confirm a `gallery` bucket now exists and is marked **public** (the SQL script creates it, but it's worth a glance).
4. From **Project Settings → API**, grab your **Project URL** and **anon public** key if you don't already have them set in Vercel.

> Same open-access note as before: anyone with your deployed link can read/write everything, including uploading or deleting photos. Fine for a private link only the two of you have — don't post it publicly.

## 2. Push the updated code

```
cd jungle-tracker
git add .
git commit -m "Add Emilio Joe tab, gallery, and log editing"
git push
```

Vercel will redeploy automatically if it's already connected to this repo. Your environment variables don't need to change.

## 3. If this is a fresh setup (not an update)

1. Push this folder to a new GitHub repo.
2. Import it in Vercel → add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables → Deploy.
3. On each phone: open the URL → Share/menu → **Add to Home Screen**.

## Milestone sources

`lib/milestones.js` has a plain array of milestones (age in days, title, description). Content is pulled and paraphrased from Cleveland Clinic, Michigan's MI Kids Matter, WebMD, and Texas WIC's baby milestone guides, which all build around the same standard checkpoints (2/4/6/9/12 months). Kept intentionally short — 8 checkpoints, not a cluttered week-by-week list. Edit the array directly if you want to add, remove, or reword any of them:

```js
{ days: 21, label: "3 weeks", emoji: "🐒", title: "Emilio's 3 weeks old!!", text: "He's ready for tummy time! ..." },
```

## Local development (optional)

```
cp .env.local.example .env.local   # fill in your Supabase values
npm install
npm run build   # verifies everything compiles
npm run dev
```

## Project structure

```
app/page.js                 app shell: tabs, shared entry state, realtime sync
app/components/HomeTab.js    quick-log buttons + stats
app/components/LogTab.js     table log with timestamp editing
app/components/EmilioTab.js  age counter, milestones, appointments, growth
app/components/GalleryTab.js photo upload/viewer
app/components/JungleDecor.js shared leaves/monkeys/background animation
app/components/JungleHeader.js top banner (safe-area aware)
app/components/BottomNav.js  4-tab bottom navigation
app/components/BottleSheet.js bottle amount picker modal
lib/milestones.js            birth date, age math, milestone data
lib/format.js                time/date formatting helpers
lib/theme.js                 shared color palette
lib/supabaseClient.js        Supabase client
supabase/schema.sql          run this in Supabase's SQL editor
public/icons/                the monkey app icon at all sizes
```
