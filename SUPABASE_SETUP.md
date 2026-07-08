# OFFANIME — Supabase cache + speed + player + ads guide

This release adds a **Supabase edge cache** (fast loads + unbreakable API), big
**mobile speed** fixes, a **megaplay sandbox** fix, and an **honest ad audit**.

---

## 1) Supabase cache — setup (15 minutes, one time)

The site now reads home/movies data from a Supabase cache that refreshes every
hour, instead of hammering the anime API + TMDB on every visit. This makes loads
near-instant and means the APIs never break under load.

### Step 1 — create the table
1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the contents of `supabase/schema.sql` and click **Run**.
   (creates the `api_cache` table + read-only public access)

### Step 2 — add the client keys to `.env`
From Supabase → **Project Settings → API**:
```
VITE_SUPABASE_URL=https://YOURPROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...   (the "anon / public" key)
```
> ⚠️ Only ever put the **anon** key in `.env`. Never the service_role key.

If you leave these blank, the site still works — it just calls the APIs directly
(no cache). So it's safe to deploy before finishing Supabase.

### Step 3 — deploy the refresh function
Install the Supabase CLI (`npm i -g supabase`), then:
```bash
supabase login
supabase link --project-ref YOURPROJECT
supabase functions deploy refresh-cache --no-verify-jwt

# set the function's server-side secrets (NOT in client .env):
supabase secrets set SUPABASE_URL=https://YOURPROJECT.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service_role key
supabase secrets set ANIME_API_URL=https://anime-details-api.vercel.app/api
supabase secrets set TMDB_API_KEY=64b03fca3936439f3d3da531973e5ff9
```

### Step 4 — run it once + schedule hourly
Run once to fill the cache:
```bash
curl -X POST https://YOURPROJECT.functions.supabase.co/refresh-cache
```
Then schedule it every hour. Supabase → **Database → Extensions** → enable
`pg_cron` + `pg_net`, then in SQL Editor:
```sql
select cron.schedule(
  'refresh-offanime-cache',
  '0 * * * *',  -- every hour, on the hour
  $$ select net.http_post(
       url := 'https://YOURPROJECT.functions.supabase.co/refresh-cache',
       headers := '{"Content-Type":"application/json"}'::jsonb
     ) $$
);
```
Done. The site now serves cached data and refreshes hourly automatically.

---

## 2) Mobile speed — what changed (LCP was 9.0s)

The Lighthouse mobile score was dragged down by the homepage **hero (Spotlight)**:
- It rendered **two full-size copies** of each hero image (a blurred bg + the main
  one) → removed the duplicate. **~50% fewer hero bytes.**
- **Every** spotlight slide loaded its image at once → now only the **first +
  active** slide load eagerly; the rest are lazy.
- The first hero image is now **`<link rel=preload>`**'d so it starts downloading
  before React mounts → directly improves LCP.
- The **12 TMDB logo fetches** ran on mount and blocked the hero → now deferred
  with `requestIdleCallback` until after first paint.
- Earlier release already: code-split the whole Movies section, split vendor
  chunks, cut the intro loader 2800ms→1400ms, added preconnects, w342 posters.

Plus the Supabase cache removes the slow TMDB/API round-trips entirely.

**After deploy, re-run PageSpeed — LCP should drop from 9s toward ~2.5–3s.**
The single biggest remaining lever is your **hero image source size** (the anime
API returns large banners). The cache + preload + lazy-rest changes are the code
side; the rest is image weight from the upstream API.

---

## 3) Megaplay player — "Sandboxed our player is not allowed"

That message comes from **megaplay itself** — they deliberately detect a
restrictive iframe `sandbox` and refuse to play, because the sandbox blocks their
ads. There is **no way to keep a strict sandbox AND have their player work** — they
engineered it to break.

**What I did:** changed the Ad-Block sandbox to a *permissive-but-safe* token set:
```
allow-scripts allow-same-origin allow-forms allow-presentation
allow-pointer-lock allow-popups allow-popups-to-escape-sandbox
allow-top-navigation-by-user-activation
```
This passes megaplay's check (so the player runs) while still **withholding
`allow-top-navigation` and `allow-modals`** — the two permissions silent
auto-redirect / pop-under ads rely on. So most intrusive ads are still blocked,
and the player plays.

> If megaplay ever fully blocks embedding again, the only robust long-term fix is
> to switch the default anime server to a source we control (HLS/ArtPlayer, like
> the Movies "Server 2"). Say the word and I'll wire an ad-free HLS server as the
> anime default with megaplay as fallback.

---

## 4) Ads / CPM — the honest truth

**I cannot change your CPM or earnings from code.** CPM is set entirely by your ad
network (Monetag + Adsterra here) based on traffic geo, placement, viewability,
and their current rates. Going from **$3–4/day with 1 banner** to **$0.01 with 3
banners** is almost never a code problem. Real causes, in order of likelihood:

1. **Network rate cut / account flagged.** Adsterra & Monetag regularly drop CPMs
   or limit accounts suspected of invalid traffic. 3 banners but near-zero revenue
   strongly suggests **the account/zones are limited**, not the layout. → Open a
   ticket with Adsterra/Monetag and ask why CPM collapsed on these zones.
2. **More ads = lower CPM, not higher.** Stuffing 3 banners where you had 1 makes
   each impression worth *less* (ad fatigue + the network spreads budget). The old
   site earned more with **1 well-placed banner**. → Go back to **1 high-viewability
   banner** near the player, not 3.
3. **Ads not actually rendering.** If the 320×50 iframe is blocked (sandbox, ad
   blocker, or the network returns blank), you get impressions logged but $0. →
   The code already falls back to a "Support OFFANIME" button when the ad fails;
   check your network dashboard for **fill rate** (low fill = no ads served).
4. **Geo.** US traffic pays best. If your traffic shifted to low-CPM countries,
   revenue drops even at the same impressions.

**What I optimized in code (the parts I *can* control):**
- Ads load reliably with a retry + graceful fallback (already in `Watch.jsx`).
- Placement is near the player (highest viewability = best CPM the network allows).

**My recommendation:** drop back to **1 banner** in the highest-viewability slot,
and contact your ad network about the CPM collapse — that's where the money is,
not in the code.
