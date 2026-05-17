-- ─────────────────────────────────────────────────────────────────
-- Bloom v3 — Core data model
--
-- Refonte fonctionnelle alignée sur le brief : OS pour cofondateurs.
-- Additive : aucune DROP TABLE — les anciennes (contacts, posts, etc.)
-- restent en place mais ne sont plus utilisées par l'UI v3.
--
-- Sequence :
--   1. teams + memberships (renommés depuis organizations / org_members)
--   2. governance_rules (refonte org_rules avec validation_mode + threshold)
--   3. decisions + decision_votes (déjà ok depuis 20260517_organizations)
--   4. projects_v3, tasks_v3, time_entries_v3 (préfixe pour vivre à côté
--      des anciens — alias via vues si besoin plus tard)
--   5. notifications (déjà ok, on ajoute juste les nouveaux `type`)
--   6. journal_entries (déjà ok, on garde immutable)
--
-- Tout est RLS-scoped par user via memberships actives.
-- ─────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════
-- 1. TEAMS (rename logical de organizations)
-- ═══════════════════════════════════════════════════════════════

-- On crée une nouvelle table teams si organizations n'existe pas,
-- sinon on s'appuie dessus (vue).
do $$
begin
  if not exists (select 1 from information_schema.tables
                 where table_schema = 'public' and table_name = 'teams') then
    -- Si organizations existe, on crée une vue. Sinon une vraie table.
    if exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = 'organizations') then
      execute 'create view public.teams as select id, name, created_by, created_at, updated_at from public.organizations';
    else
      execute $cmd$
        create table public.teams (
          id uuid primary key default gen_random_uuid(),
          name text not null check (length(name) between 1 and 80),
          created_by uuid not null references auth.users(id) on delete restrict,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      $cmd$;
      execute 'alter table public.teams enable row level security';
    end if;
  end if;
end$$;

-- ═══════════════════════════════════════════════════════════════
-- 2. MEMBERSHIPS (refacto enrichi de organization_members)
-- ═══════════════════════════════════════════════════════════════

-- Ajout colonnes manquantes sur organization_members existante si elle existe.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'organization_members') then
    -- Ajouter shares + permissions si pas déjà présent
    if not exists (select 1 from information_schema.columns
                   where table_schema = 'public' and table_name = 'organization_members'
                   and column_name = 'permissions') then
      execute 'alter table public.organization_members add column permissions jsonb default ''{}''::jsonb';
    end if;
    -- shares existait déjà sous le nom equity_pct dans la migration 20260517
    -- on aliase via une vue plus bas
  end if;
end$$;

-- Vue memberships : alias propre + colonne shares (depuis equity_pct)
create or replace view public.memberships as
select
  id,
  organization_id as team_id,
  user_id,
  role,
  equity_pct as shares,
  coalesce(permissions, '{}'::jsonb) as permissions,
  status,
  joined_at as created_at
from public.organization_members;

-- ═══════════════════════════════════════════════════════════════
-- 3. GOVERNANCE_RULES (refacto enrichi de organization_rules)
-- ═══════════════════════════════════════════════════════════════

-- Nouvelle table dédiée : 1 ligne par règle (vs ancienne table flat 1:1 avec org)
create table if not exists public.governance_rules (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.organizations(id) on delete cascade,
  type text not null check (type in (
    'spending_threshold', 'hiring', 'equity_change', 'distribution', 'other'
  )),
  threshold_amount_cents int,
  validation_mode text not null check (validation_mode in (
    'single_owner', 'majority_vote', 'unanimous'
  )),
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_governance_rules_team
  on public.governance_rules(team_id, active);

alter table public.governance_rules enable row level security;

drop policy if exists "Members read rules" on public.governance_rules;
create policy "Members read rules" on public.governance_rules
  for select using (
    team_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "Founders manage rules" on public.governance_rules;
create policy "Founders manage rules" on public.governance_rules
  for all using (
    team_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role = 'founder' and status = 'active'
    )
  ) with check (
    team_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role = 'founder' and status = 'active'
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 4a. PROJECTS_V3 (nouvelle table — schéma propre)
--
-- L'ancienne `projects` reste en place (CRM legacy). v3 a un schéma
-- clean : team_id nullable (solo), owner_user_id, status enum, due_date.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.projects_v3 (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  description text default '',
  status text not null default 'active' check (status in (
    'active', 'archived'
  )),
  color text,                                                -- pour UI
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_v3_team on public.projects_v3(team_id);
create index if not exists idx_projects_v3_owner on public.projects_v3(owner_user_id);
create index if not exists idx_projects_v3_status on public.projects_v3(status);

alter table public.projects_v3 enable row level security;

-- Solo : owner only ; Team : tous les membres actifs
drop policy if exists "Members read projects" on public.projects_v3;
create policy "Members read projects" on public.projects_v3
  for select using (
    owner_user_id = auth.uid()
    or (team_id is not null and team_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    ))
  );

drop policy if exists "Owners or members manage projects" on public.projects_v3;
create policy "Owners or members manage projects" on public.projects_v3
  for all using (
    owner_user_id = auth.uid()
    or (team_id is not null and team_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    ))
  ) with check (
    owner_user_id = auth.uid()
    or (team_id is not null and team_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    ))
  );

-- ═══════════════════════════════════════════════════════════════
-- 4b. TASKS_V3
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.tasks_v3 (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects_v3(id) on delete cascade,
  assignee_user_id uuid references auth.users(id) on delete set null,
  title text not null check (length(title) between 1 and 200),
  description text default '',
  status text not null default 'todo' check (status in (
    'todo', 'in_progress', 'done'
  )),
  priority text not null default 'medium' check (priority in (
    'low', 'medium', 'high'
  )),
  due_date date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_v3_project on public.tasks_v3(project_id);
create index if not exists idx_tasks_v3_assignee on public.tasks_v3(assignee_user_id);
create index if not exists idx_tasks_v3_status on public.tasks_v3(project_id, status);

alter table public.tasks_v3 enable row level security;

-- Accès = accès au projet parent
drop policy if exists "Project members access tasks" on public.tasks_v3;
create policy "Project members access tasks" on public.tasks_v3
  for all using (
    project_id in (
      select id from public.projects_v3
      where owner_user_id = auth.uid()
         or (team_id is not null and team_id in (
              select organization_id from public.organization_members
              where user_id = auth.uid() and status = 'active'
            ))
    )
  ) with check (
    project_id in (
      select id from public.projects_v3
      where owner_user_id = auth.uid()
         or (team_id is not null and team_id in (
              select organization_id from public.organization_members
              where user_id = auth.uid() and status = 'active'
            ))
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 4c. TIME_ENTRIES_V3
--
-- Règle métier critique : un seul time_entry actif (ended_at null)
-- par user — enforced via contrainte unique partielle.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.time_entries_v3 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects_v3(id) on delete set null,
  task_id uuid references public.tasks_v3(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int generated always as (
    case
      when ended_at is null then null
      else greatest(0, extract(epoch from (ended_at - started_at))::int)
    end
  ) stored,
  note text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_time_entries_v3_user_started
  on public.time_entries_v3(user_id, started_at desc);

create index if not exists idx_time_entries_v3_project
  on public.time_entries_v3(project_id);

-- ⭐ Contrainte clé : 1 seul timer actif par user.
create unique index if not exists uniq_time_entries_v3_active_per_user
  on public.time_entries_v3(user_id)
  where ended_at is null;

alter table public.time_entries_v3 enable row level security;

drop policy if exists "Users manage own time entries" on public.time_entries_v3;
create policy "Users manage own time entries" on public.time_entries_v3
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- 5. NOTIFICATIONS — déjà existante, on ajoute juste les types v3
--
-- Cette table existe depuis 20260514_cloud_sync.sql (collaborations).
-- On laisse en l'état, le service ajoute les types côté code (zod).
-- Types attendus : 'new_decision', 'vote_result', 'task_assigned',
-- 'timer_reminder', 'rule_change', 'member_joined'.
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 6. SEED MINIMAL (optionnel — uniquement en dev local)
--
-- À exécuter manuellement dans Supabase Studio SQL Editor en dev.
-- Décommenter pour seeder. Ne PAS commiter en prod.
-- ═══════════════════════════════════════════════════════════════
--
-- do $$
-- declare
--   marc_id uuid := (select id from auth.users where email = 'marc.clby.972@gmail.com' limit 1);
--   team_id uuid;
--   project_id uuid;
-- begin
--   if marc_id is null then return; end if;
--
--   -- Team
--   insert into public.organizations (name, created_by)
--   values ('Bloom Studio', marc_id) returning id into team_id;
--
--   insert into public.organization_members (organization_id, user_id, role)
--   values (team_id, marc_id, 'founder');
--
--   -- Project
--   insert into public.projects_v3 (team_id, owner_user_id, name, description)
--   values (team_id, marc_id, 'Bloom v3', 'Refonte produit') returning id into project_id;
--
--   -- Tasks
--   insert into public.tasks_v3 (project_id, created_by, title, status, priority) values
--     (project_id, marc_id, 'Design system', 'done', 'high'),
--     (project_id, marc_id, 'Services & hooks', 'in_progress', 'high'),
--     (project_id, marc_id, 'Tests E2E', 'todo', 'medium');
--
--   -- Governance rule
--   insert into public.governance_rules (team_id, type, threshold_amount_cents, validation_mode)
--   values (team_id, 'spending_threshold', 10000, 'majority_vote');
-- end$$;
