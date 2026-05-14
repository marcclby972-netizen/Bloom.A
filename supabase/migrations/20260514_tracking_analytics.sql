-- Tracking analytics schema for Bloom
-- Run this migration on your Supabase project via the SQL editor.

-- Sites table — one row per website tracked
create table if not exists public.tracking_sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  domain text not null,
  created_at timestamptz not null default now()
);

create index if not exists tracking_sites_user_id_idx on public.tracking_sites(user_id);

-- Events table — pageviews + custom events
create table if not exists public.tracking_events (
  id bigserial primary key,
  site_id uuid not null references public.tracking_sites(id) on delete cascade,
  event_type text not null default 'pageview',
  path text,
  referrer text,
  user_agent text,
  country text,
  session_id text,
  created_at timestamptz not null default now()
);

create index if not exists tracking_events_site_id_idx on public.tracking_events(site_id);
create index if not exists tracking_events_created_at_idx on public.tracking_events(created_at desc);

-- RLS
alter table public.tracking_sites enable row level security;
alter table public.tracking_events enable row level security;

-- Sites: users can only see/manage their own
create policy "Users manage own sites"
  on public.tracking_sites
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Events: users can read events for their own sites; inserts are public (for the tracker)
create policy "Users read own events"
  on public.tracking_events
  for select
  using (
    site_id in (select id from public.tracking_sites where user_id = auth.uid())
  );

-- Anonymous insert allowed (tracker pings without auth) — but only if site_id exists
create policy "Anyone can insert events for valid sites"
  on public.tracking_events
  for insert
  with check (
    site_id in (select id from public.tracking_sites)
  );
