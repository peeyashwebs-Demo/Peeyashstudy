# PeeyashStudy — Setup Guide

This is your real, working codebase: Next.js + Supabase + Gemini + Paystack, built exactly to the framework we planned. Everything below is what YOU need to go get, in order. Nothing here needs you to write code — just create accounts, copy keys, and paste.

Total cost to get this live: **₦0**, apart from a domain later.

---

## What's already built for you

- Landing page, signup/login, dashboard, upload, practice quizzes, course chat, draft review, wallet, referrals, feedback, admin panel
- All database tables + security rules (`supabase/schema.sql`)
- Assignment Decoder, Quiz Generator, Chat, Draft Review — wired to Gemini with automatic Groq fallback and caching so repeat TMAs cost nothing
- Paystack subscription checkout + webhook that activates premium AND pays your referral bonus automatically
- Manual withdrawal request flow + your private admin page to approve payouts
- Verified: `npm run build` compiles clean, 22 routes, zero errors

---

## Step 1 — Get the code running on your computer

You'll need [Node.js](https://nodejs.org) installed (get the LTS version) and a code editor (VS Code is free).

1. Download the project folder I've given you.
2. Open a terminal inside it and run:
   ```
   npm install
   ```
3. Copy `.env.example` to a new file called `.env.local` in the same folder. You'll fill in the real values as you go through Steps 2–4 below.

---

## Step 2 — Supabase (your database, auth, and file storage)

1. Go to **supabase.com** → sign up free (no card needed) → "New Project."
2. Pick any name (e.g. `peeyashstudy`), set a database password (save it somewhere), pick a region close to Nigeria (e.g. Frankfurt or London).
3. Once it's created, go to **SQL Editor** in the left sidebar → New Query.
4. Open the file `supabase/schema.sql` from your project, copy the **entire contents**, paste into the SQL editor, and click **Run**. This creates every table, security rule, and the signup automation in one go.
5. Go to **Settings → API**. Copy three values into your `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (click "reveal") → `SUPABASE_SERVICE_ROLE_KEY` — **never share this one publicly**
6. Go to **Authentication → Providers** and confirm Email is enabled (it is by default). Optional: enable Google sign-in later for one-tap login.
7. Go to **Authentication → URL Configuration**. Set:
   - **Site URL:** your real Vercel URL, e.g. `https://peeyashstudy.vercel.app`
   - **Redirect URLs:** add `https://peeyashstudy.vercel.app/auth/callback` (use your real domain)
   This is what makes the "confirm your email" link take students to a clean PeeyashStudy login page instead of a generic Supabase page.
8. **For profile photos (Settings page):** go to **Storage** (left sidebar) → **Create a new bucket** → name it exactly `avatars` → toggle **Public bucket** ON → Create. This lets students upload a profile photo from Settings.
9. **Critical — without this step, uploads will fail even though the bucket exists:** go to **SQL Editor** → New query → paste and run just this part of `schema.sql` (it's at the very bottom of the file, under "STORAGE POLICIES"):
   ```sql
   create policy "Avatar images are publicly readable"
     on storage.objects for select using (bucket_id = 'avatars');
   create policy "Users can upload their own avatar"
     on storage.objects for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
   create policy "Users can update their own avatar"
     on storage.objects for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
   create policy "Users can delete their own avatar"
     on storage.objects for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
   ```
   "Public bucket" only controls who can *view* photos — these policies are what actually allow a logged-in student to *upload* one. This is almost certainly why you saw a "can't fetch bucket" style error.
9. **If your schema.sql already ran before this update:** go to SQL Editor → run:
   ```sql
   alter table profiles add column if not exists avatar_url text;
   ```
   (If you're running the full schema.sql fresh on a brand new project, this column is already included — skip this step.)

---

## Step 3 — Gemini (the free AI engine)

1. Go to **aistudio.google.com** → sign in with any Google account.
2. Click **Get API key** → **Create API key**. No card required for the free tier.
3. Copy it into `.env.local` as `GEMINI_API_KEY`.
4. Optional backup: **console.groq.com** → sign up free → create an API key → paste as `GROQ_API_KEY`. This is your automatic fallback if Gemini's daily limit is ever hit — the app switches over on its own, you don't have to do anything.

**Important:** don't touch billing on this Google Cloud project until you have paying subscribers (see the upgrade trigger in Step 7). Turning on billing early kills the free tier.

---

## Step 4 — Paystack (payments in and out)

1. Go to **dashboard.paystack.co** → sign up → verify your email.
2. You'll start in **Test Mode** — perfect for now, no real money moves.
3. Go to **Settings → API Keys & Webhooks**. Copy:
   - `Secret Key` → `PAYSTACK_SECRET_KEY`
   - `Public Key` → `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
4. You'll add the **Webhook URL** after deploying (Step 5) — it needs your live web address first.
5. When you're ready to accept real money, complete Paystack's business verification and switch to **Live Mode** — you'll get a new pair of live keys to swap in.
6. **Critical step — the webhook:** go to this same page → find **Webhook URL** (separate from "Callback URL") → set it to `https://YOUR-REAL-DOMAIN/api/paystack/webhook`. Without this, payments will go through on Paystack's side but PeeyashStudy will never find out, so premium never activates and referral bonuses never get paid. (There's also a backup check built in — the app double-checks payment status the moment someone returns to the dashboard after paying — but the webhook is still the correct primary path and should be set.)

---

## Step 4.5 — Push notifications (already generated for you)

Real VAPID keys were generated specifically for this project — just paste them into Vercel's environment variables:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = `BLqmcyrfEKjGkvHnkk0gKaLb8xJXvxzx6Z7fhzYFDEsSjvjA1He2seKkH_jc2Nay80u2PNIXcckLP4tEe4K3IZ8`
- `VAPID_PRIVATE_KEY` = `X4kFfg3V_x-e7sGuzrcvi9e5Q12GAYJwP5Fvw8kA8_Q`
- `VAPID_SUBJECT` = `mailto:` followed by your real email, e.g. `mailto:you@gmail.com`
- `CRON_SECRET` = any random string you make up (e.g. mash your keyboard) — this just stops strangers from triggering your reminder job manually.

These power: the "Turn on notifications" toggle in Settings, a push the moment someone's referral bonus lands, and a daily automatic check (`vercel.json` already configures this to run every morning at 8am) that reminds students about deadlines within 48 hours.

**One extra Supabase step for these new features:** if your database already existed before this update, run this in the SQL Editor:
```sql
alter table deadlines add column if not exists reminded_at timestamptz;
```
(then also run the `push_subscriptions` table + its RLS policies from the bottom sections of `schema.sql`, same as the migration note at the top of that file explains).

## Step 5 — Deploy to Vercel (put it on the internet)

1. Push this project to a GitHub repository (create a free GitHub account if you don't have one; GitHub Desktop is the easiest way if you're not comfortable with git commands).
2. Go to **vercel.com** → sign up free with your GitHub account → **Add New Project** → select your repo.
3. Before clicking Deploy, open **Environment Variables** and paste in every value from your `.env.local` (all the Supabase, Gemini, Paystack keys, plus set `NEXT_PUBLIC_APP_URL` to what Vercel will give you, e.g. `https://peeyashstudy.vercel.app`, and `ADMIN_EMAIL` to the email you'll personally sign up with).
4. Click **Deploy**. In about a minute, your app is live at `peeyashstudy.vercel.app`.
5. Go back to Paystack → **Settings → API Keys & Webhooks** → add the webhook URL: `https://peeyashstudy.vercel.app/api/paystack/webhook`.

---

## Step 6 — Make yourself the admin and seed the cache

1. Visit your live site, sign up using the **same email** you set as `ADMIN_EMAIL` in Vercel.
2. Visit `/admin` — you'll now see the withdrawal queue, feedback, and cache stats.
3. Go to `/upload` and run 3–5 of this semester's real MIVA TMAs through the Decoder yourself. This pre-seeds the cache, so the first real students get instant results on day one.

---

## Step 7 — The one trigger to remember

The moment you have **4 paying subscribers**, go to **console.cloud.google.com**, create a **new, separate** project, enable billing there, and generate a new Gemini key from that billed project. Swap `GEMINI_API_KEY` in Vercel to the new key. Your original free-tier key and project stay untouched as a backup. Do NOT enable billing on your original project — it permanently removes its free tier.

---

## Things I'd want if I were building this with you (optional, in priority order)

1. **A test MIVA TMA PDF** — send me one and I'll verify the Decoder's output quality against a real assignment before you launch.
2. **Your Paystack test-mode keys**, once you have them, if you want me to walk through a live test payment with you.
3. **A domain name** (`peeyashstudy.com`) once your first subscribers land — I can help you connect it to Vercel in a few minutes.
4. **A decision on the admin email** — the one you'll personally use, since that's what unlocks `/admin`.

Nothing else is required from you to launch — everything else in the framework (WhatsApp bot, past-questions bank, streaks) is Phase 2, after real students are using this.

---

## If something breaks

- **Build fails on Vercel:** almost always a missing environment variable — check every key from `.env.example` is set.
- **Signup works but no profile appears:** re-run `supabase/schema.sql` — the trigger that creates profiles/wallets on signup may not have run.
- **AI requests fail:** check your Gemini key is correct and that you haven't hit the free daily limit (visible in Google AI Studio) — Groq fallback covers this automatically if configured.
- **Paystack webhook not firing:** confirm the webhook URL in Paystack settings exactly matches `https://YOUR-DOMAIN/api/paystack/webhook`.

Send me any error message you get — paste it here and I'll fix it with you.
