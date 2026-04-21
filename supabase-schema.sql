-- ============================================
-- LinkSnap — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- TABLE: links
-- ─────────────────────────────────────────────
create table public.links (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  slug        text not null unique,
  original_url text not null,
  title       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for fast slug lookups (used on every redirect)
create unique index links_slug_idx on public.links(slug);
create index links_user_id_idx on public.links(user_id);

-- ─────────────────────────────────────────────
-- TABLE: clicks
-- ─────────────────────────────────────────────
create table public.clicks (
  id          uuid primary key default uuid_generate_v4(),
  link_id     uuid not null references public.links(id) on delete cascade,
  referrer    text,           -- domain that sent the click (twitter.com, etc.)
  browser     text,           -- Chrome, Firefox, Safari, Edge
  device      text,           -- Desktop, Mobile, Tablet
  os          text,           -- Windows, macOS, iOS, Android
  source      text,           -- social, direct, referral, email, organic
  action      text default 'click', -- click | copy | share
  country     text,           -- from IP geolocation (future)
  ip          text,           -- raw IP — legal to store, disclose in privacy policy
  created_at  timestamptz not null default now()
);

create index clicks_link_id_idx on public.clicks(link_id);
create index clicks_created_at_idx on public.clicks(created_at);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table public.links enable row level security;
alter table public.clicks enable row level security;

-- Links: users can only see and manage their own
create policy "links_select_own" on public.links
  for select using (auth.uid() = user_id);

create policy "links_insert_own" on public.links
  for insert with check (auth.uid() = user_id);

create policy "links_update_own" on public.links
  for update using (auth.uid() = user_id);

create policy "links_delete_own" on public.links
  for delete using (auth.uid() = user_id);

-- Clicks: users can read clicks for their own links
create policy "clicks_select_own" on public.clicks
  for select using (
    exists (
      select 1 from public.links
      where links.id = clicks.link_id
      and links.user_id = auth.uid()
    )
  );

-- Clicks INSERT is done via service role from the [slug] redirect handler
-- so anon users can insert (the slug page runs server-side with service key)
create policy "clicks_insert_anon" on public.clicks
  for insert with check (true);

-- ─────────────────────────────────────────────
-- HELPER: auto-update updated_at
-- ─────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger links_updated_at
  before update on public.links
  for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────────────
-- HELPFUL VIEWS (optional but useful)
-- ─────────────────────────────────────────────

-- Aggregated click counts per link
create or replace view public.link_stats as
select
  l.id,
  l.user_id,
  l.slug,
  l.original_url,
  l.title,
  l.active,
  l.created_at,
  count(c.id) as total_clicks,
  count(c.id) filter (where c.created_at >= now() - interval '1 day') as clicks_today,
  count(c.id) filter (where c.created_at >= now() - interval '7 days') as clicks_week,
  count(c.id) filter (where c.created_at >= now() - interval '30 days') as clicks_month
from public.links l
left join public.clicks c on c.link_id = l.id
group by l.id;
