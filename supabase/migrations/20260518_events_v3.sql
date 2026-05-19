-- ─────────────────────────────────────────────────────────────────
-- Bloom v3 — events_v3 (calendrier natif)
--
-- Évènements de calendrier liés optionnellement à un projet et/ou une
-- tâche. Compatible solo (team_id NULL) ou équipe.
--
-- RLS :
--   - lecture : owner OU membre actif de la team
--   - écriture / mutation : owner uniquement
--
-- Pas de récurrence pour la v1 (RRULE viendra plus tard si besoin).
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.events_v3 (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  team_id       uuid references public.organizations(id) on delete cascade,
  project_id    uuid references public.projects_v3(id) on delete set null,
  task_id       uuid references public.tasks_v3(id) on delete set null,
  title         text not null check (char_length(title) between 1 and 200),
  description   text,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  all_day       boolean not null default false,
  color         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint events_v3_time_range_check check (ends_at >= starts_at)
);

create index if not exists events_v3_user_starts_idx
  on public.events_v3 (user_id, starts_at);

create index if not exists events_v3_team_starts_idx
  on public.events_v3 (team_id, starts_at)
  where team_id is not null;

create index if not exists events_v3_project_idx
  on public.events_v3 (project_id)
  where project_id is not null;

create index if not exists events_v3_task_idx
  on public.events_v3 (task_id)
  where task_id is not null;

alter table public.events_v3 enable row level security;

-- READ : owner OU membre actif de la team
drop policy if exists "events_v3 read own or team" on public.events_v3;
create policy "events_v3 read own or team"
  on public.events_v3
  for select
  using (
    auth.uid() = user_id
    or (
      team_id is not null
      and exists (
        select 1 from public.organization_members om
        where om.organization_id = events_v3.team_id
          and om.user_id = auth.uid()
          and om.status = 'active'
      )
    )
  );

-- INSERT : doit être l'owner et membre actif si team_id
drop policy if exists "events_v3 insert owner" on public.events_v3;
create policy "events_v3 insert owner"
  on public.events_v3
  for insert
  with check (
    auth.uid() = user_id
    and (
      team_id is null
      or exists (
        select 1 from public.organization_members om
        where om.organization_id = events_v3.team_id
          and om.user_id = auth.uid()
          and om.status = 'active'
      )
    )
  );

-- UPDATE / DELETE : owner uniquement
drop policy if exists "events_v3 update own" on public.events_v3;
create policy "events_v3 update own"
  on public.events_v3
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "events_v3 delete own" on public.events_v3;
create policy "events_v3 delete own"
  on public.events_v3
  for delete
  using (auth.uid() = user_id);

-- Trigger updated_at
create or replace function public.events_v3_touch_updated()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists events_v3_touch_updated_trg on public.events_v3;
create trigger events_v3_touch_updated_trg
  before update on public.events_v3
  for each row execute function public.events_v3_touch_updated();
