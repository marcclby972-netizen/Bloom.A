-- ─────────────────────────────────────────────────────────────────
-- Bloom v3 — social_drafts_v3 + social_targets_v3
--
-- Content planner multi-plateforme (LinkedIn, X, Instagram, TikTok)
-- avec objectifs par plateforme et suivi de streak.
--
-- Cf. Notion "🌸 Bloom — Features complètes" §"Plannificateur de contenu
-- multi-plateforme" + page brief Glowup §H.
--
-- Pas d'API de publication automatique (manual + reminders only).
-- ─────────────────────────────────────────────────────────────────

create type if not exists public.social_platform as enum (
  'linkedin',
  'x',
  'instagram',
  'tiktok'
);

create type if not exists public.social_draft_status as enum (
  'brouillon',
  'planifie',
  'publie'
);

-- ─── Drafts ───
create table if not exists public.social_drafts_v3 (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  team_id       uuid references public.organizations(id) on delete cascade,
  platform      public.social_platform not null,
  title         text not null check (char_length(title) between 1 and 200),
  content       text not null check (char_length(content) between 1 and 5000),
  status        public.social_draft_status not null default 'brouillon',
  scheduled_at  timestamptz,
  /** Set quand l'user marque manuellement le post comme publié. */
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists social_drafts_v3_user_platform_idx
  on public.social_drafts_v3 (user_id, platform, status);

create index if not exists social_drafts_v3_published_idx
  on public.social_drafts_v3 (user_id, platform, published_at)
  where published_at is not null;

create index if not exists social_drafts_v3_scheduled_idx
  on public.social_drafts_v3 (user_id, scheduled_at)
  where scheduled_at is not null;

alter table public.social_drafts_v3 enable row level security;

drop policy if exists "social_drafts_v3 owner all" on public.social_drafts_v3;
create policy "social_drafts_v3 owner all"
  on public.social_drafts_v3
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger updated_at
create or replace function public.social_drafts_v3_touch_updated()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists social_drafts_v3_touch_updated_trg on public.social_drafts_v3;
create trigger social_drafts_v3_touch_updated_trg
  before update on public.social_drafts_v3
  for each row execute function public.social_drafts_v3_touch_updated();

-- ─── Targets ───
create table if not exists public.social_targets_v3 (
  user_id          uuid not null references auth.users(id) on delete cascade,
  platform         public.social_platform not null,
  /** 0 = pas d'objectif quotidien. Sinon nombre de posts à publier par jour. */
  target_per_day   int not null default 0 check (target_per_day >= 0),
  target_per_week  int not null default 0 check (target_per_week >= 0),
  updated_at       timestamptz not null default now(),
  primary key (user_id, platform)
);

alter table public.social_targets_v3 enable row level security;

drop policy if exists "social_targets_v3 owner all" on public.social_targets_v3;
create policy "social_targets_v3 owner all"
  on public.social_targets_v3
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
