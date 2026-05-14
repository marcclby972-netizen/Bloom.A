-- Allow multiple OAuth accounts per user × platform
-- Run this AFTER 20260515_social_oauth.sql on Supabase SQL Editor.

-- 1. Add new columns
alter table public.social_oauth_tokens add column if not exists id uuid default gen_random_uuid();
alter table public.social_oauth_tokens add column if not exists provider_account_id text;

-- 2. Backfill provider_account_id from existing account_metadata (one row per user×platform today)
update public.social_oauth_tokens
set provider_account_id = coalesce(
  account_metadata->>'channelId',
  account_metadata->>'open_id',
  account_metadata->>'sub',
  'legacy_' || (extract(epoch from created_at)::text)
)
where provider_account_id is null;

-- 3. Make provider_account_id required
alter table public.social_oauth_tokens alter column provider_account_id set not null;
alter table public.social_oauth_tokens alter column id set not null;

-- 4. Drop the old (user_id, platform) primary key
alter table public.social_oauth_tokens drop constraint if exists social_oauth_tokens_pkey;

-- 5. New primary key on id
alter table public.social_oauth_tokens add primary key (id);

-- 6. Unique constraint so reconnecting the same provider account updates instead of duplicating
alter table public.social_oauth_tokens
  add constraint social_oauth_tokens_user_platform_account_unique
  unique (user_id, platform, provider_account_id);

-- 7. Re-create index (the user_id one might still exist)
create index if not exists social_oauth_tokens_user_platform_idx
  on public.social_oauth_tokens(user_id, platform);
