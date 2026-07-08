-- ============================================================================
-- OFFANIME — Auth + user-sync schema (profiles, watch progress, watch later)
-- Run once in: Supabase dashboard -> SQL Editor -> New query -> Run
--
-- SAFETY: Every table below has Row-Level Security ON with policies that allow
-- a user to touch ONLY their own rows (auth.uid() = user_id). With the public
-- anon key, user A can NEVER read or write user B's data. Passwords are handled
-- entirely by Supabase Auth (auth.users, bcrypt-hashed) — we never store them.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) profiles — public-ish per-user info (username), 1:1 with auth.users.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: upsert own" on public.profiles;
create policy "profiles: upsert own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2) watch_progress — "continue watching": last episode + position per anime.
--    Keyed by (user_id, anime_id) so one row per anime per user.
-- ----------------------------------------------------------------------------
create table if not exists public.watch_progress (
  user_id      uuid not null references auth.users (id) on delete cascade,
  anime_id     text not null,           -- our internal anime id (string)
  watch_id     text,                    -- slug used to build /watch/<slug>
  title        text,
  poster       text,
  episode      integer not null default 1,
  total        integer,                 -- total episodes (if known)
  updated_at   timestamptz not null default now(),
  primary key (user_id, anime_id)
);

create index if not exists watch_progress_user_updated_idx
  on public.watch_progress (user_id, updated_at desc);

alter table public.watch_progress enable row level security;

drop policy if exists "progress: read own" on public.watch_progress;
create policy "progress: read own"
  on public.watch_progress for select
  using (auth.uid() = user_id);

drop policy if exists "progress: insert own" on public.watch_progress;
create policy "progress: insert own"
  on public.watch_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "progress: update own" on public.watch_progress;
create policy "progress: update own"
  on public.watch_progress for update
  using (auth.uid() = user_id);

drop policy if exists "progress: delete own" on public.watch_progress;
create policy "progress: delete own"
  on public.watch_progress for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3) watch_later — saved-for-later list. One row per (user_id, anime_id).
-- ----------------------------------------------------------------------------
create table if not exists public.watch_later (
  user_id      uuid not null references auth.users (id) on delete cascade,
  anime_id     text not null,
  watch_id     text,
  title        text,
  poster       text,
  added_at     timestamptz not null default now(),
  primary key (user_id, anime_id)
);

create index if not exists watch_later_user_added_idx
  on public.watch_later (user_id, added_at desc);

alter table public.watch_later enable row level security;

drop policy if exists "later: read own" on public.watch_later;
create policy "later: read own"
  on public.watch_later for select
  using (auth.uid() = user_id);

drop policy if exists "later: insert own" on public.watch_later;
create policy "later: insert own"
  on public.watch_later for insert
  with check (auth.uid() = user_id);

drop policy if exists "later: delete own" on public.watch_later;
create policy "later: delete own"
  on public.watch_later for delete
  using (auth.uid() = user_id);
