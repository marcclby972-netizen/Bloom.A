-- Google Calendar OAuth tokens storage
-- Run this migration on your Supabase project via the SQL editor.

create table if not exists public.google_calendar_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_calendar_tokens enable row level security;

create policy "Users manage own Google tokens"
  on public.google_calendar_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
