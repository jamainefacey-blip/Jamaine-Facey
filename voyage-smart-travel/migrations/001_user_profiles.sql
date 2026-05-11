-- ─────────────────────────────────────────────────────────────────────────────
-- VST — Migration 001: user_profiles
-- Run in Supabase SQL editor or via supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.user_profiles (
  id                 uuid        primary key references auth.users(id) on delete cascade,
  display_name       text,
  avatar_url         text,
  bio                text,
  travel_preferences jsonb       not null default '{}',
  eco_score          integer     not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table public.user_profiles enable row level security;

-- Anyone can read display_name and avatar_url (public leaderboard, community)
create policy "public_read_display"
  on public.user_profiles
  for select
  using (true);

-- Users can only update their own row
create policy "users_update_own"
  on public.user_profiles
  for update
  using (auth.uid() = id);

-- Users can insert their own row (handled by trigger, but allow manual upsert)
create policy "users_insert_own"
  on public.user_profiles
  for insert
  with check (auth.uid() = id);

-- ── Auto-update trigger ───────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row
  execute procedure public.set_updated_at();

-- ── Auto-create profile on signup ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
