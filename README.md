# Emilio's Jungle 🐒

A tap-and-track diaper/feeding log for two people, synced live via Supabase and installable on your phone's home screen.

## 1. Create the Supabase backend

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Once it's ready, open the **SQL Editor** and run everything in `supabase/schema.sql`. This creates the `entries` table, sets up permissive read/write policies, and turns on realtime sync.
3. Go to **Project Settings → API**. Copy the **Project URL** and the **anon public** key — you'll need both in step 3.

> Heads up: the policies in `schema.sql` allow anyone with your deployed link to read and write entries (no login required, to keep this simple for two people sharing a link). Don't post the link publicly.

## 2. Get the code onto GitHub

1. Unzip this project.
2. Create a new (private) GitHub repo and push this folder to it:
   ```
   cd jungle-tracker
   git init
   git add .
   git commit -m "Emilio's Jungle"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

## 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import the GitHub repo you just created.
2. Before deploying, open **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon public key
3. Click **Deploy**. You'll get a URL like `emilios-jungle.vercel.app`.

## 4. Add it to your home screens

**iPhone (Safari):** open the Vercel URL → tap the Share icon → **Add to Home Screen**. The monkey icon shows up like a real app, no browser bar.

**Android (Chrome):** open the URL → tap the ⋮ menu → **Add to Home screen** / **Install app**.

Do this on both your phone and your girlfriend's — you're both just opening the same URL, and entries sync instantly between you thanks to Supabase realtime.

## Local development (optional)

```
cp .env.local.example .env.local   # fill in your Supabase values
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Project structure

```
app/page.js        the whole app UI + Supabase logic
app/layout.js       PWA metadata, icons, service worker registration
public/manifest.json  home screen icon/name config
public/sw.js         minimal service worker (required for installability)
public/icons/        the monkey app icon at all needed sizes
supabase/schema.sql   run this once in Supabase's SQL editor
```
