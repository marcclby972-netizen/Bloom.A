-- Social media OAuth tokens — single table for all platforms
-- Run this on Supabase SQL Editor.

create table if not exists public.social_oauth_tokens (
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('youtube', 'meta', 'tiktok', 'linkedin')),
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  account_metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, platform)
);

create index if not exists social_oauth_tokens_user_id_idx on public.social_oauth_tokens(user_id);

alter table public.social_oauth_tokens enable row level security;

drop policy if exists "Users manage own social tokens" on public.social_oauth_tokens;
create policy "Users manage own social tokens"
  on public.social_oauth_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
