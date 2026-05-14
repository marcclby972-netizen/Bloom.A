-- LinkedIn Studio: scheduled posts, drafts, ideas, publications
-- Run on Supabase SQL Editor.

create table if not exists public.linkedin_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- which linkedin account to publish from (multi-account support)
  oauth_token_id uuid references public.social_oauth_tokens(id) on delete set null,
  -- workflow status
  status text not null default 'idea' check (status in ('idea', 'draft', 'scheduled', 'published', 'failed')),
  -- AI brief
  brief text default '',
  objective text default 'engagement', -- engagement, awareness, conversion
  style text default 'standard',       -- standard, premium, story, listicle, hot_take
  -- content
  title text default '',
  content text not null default '',
  media_urls text[] default '{}',
  hashtags text[] default '{}',
  -- scheduling / publication
  scheduled_at timestamptz,
  published_at timestamptz,
  linkedin_post_urn text, -- e.g., urn:li:share:7100000000000
  publish_error text,
  -- link to project
  project_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists linkedin_posts_user_status_idx on public.linkedin_posts(user_id, status);
create index if not exists linkedin_posts_scheduled_idx on public.linkedin_posts(status, scheduled_at) where status = 'scheduled';

alter table public.linkedin_posts enable row level security;

drop policy if exists "Users manage own LinkedIn posts" on public.linkedin_posts;
create policy "Users manage own LinkedIn posts"
  on public.linkedin_posts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
