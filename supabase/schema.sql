-- ============================================================================
-- OFFANIME — Supabase edge-cache schema
-- Run this once in: Supabase dashboard -> SQL Editor -> New query -> Run
-- ============================================================================

-- A single generic cache table. Each row is one JSON snapshot keyed by a string
-- (e.g. "home", "category:tv", "tmdb:21").
create table if not exists public.api_cache (
  cache_key   text primary key,
  payload     jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Index for freshness queries.
create index if not exists api_cache_updated_at_idx on public.api_cache (updated_at);

-- ----------------------------------------------------------------------------
-- Row Level Security: allow the public (anon) key to READ the cache, but only
-- the service_role key (used by the Edge Function) can WRITE it.
-- ----------------------------------------------------------------------------
alter table public.api_cache enable row level security;

drop policy if exists "public can read cache" on public.api_cache;
create policy "public can read cache"
  on public.api_cache
  for select
  using (true);

-- (No insert/update policy for anon => writes are blocked for the anon key.
--  The service_role key bypasses RLS, so the Edge Function can still write.)
