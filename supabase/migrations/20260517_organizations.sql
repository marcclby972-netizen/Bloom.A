-- Organizations + members + invites + decisions + journal
-- Used by the mobile app (Bloom OS for co-founders).
-- All tables are scoped to the calling user via RLS.

-- ── Organizations ──────────────────────────────────────────────

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- A user can SELECT an org if they're a member (founder/collaborator/etc.)
drop policy if exists "Members can read their org" on public.organizations;
create policy "Members can read their org" on public.organizations
  for select using (
    id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "Users can create orgs" on public.organizations;
create policy "Users can create orgs" on public.organizations
  for insert with check (created_by = auth.uid());

-- Only founders can update/delete the org itself
drop policy if exists "Founders manage org" on public.organizations;
create policy "Founders manage org" on public.organizations
  for update using (
    id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role = 'founder' and status = 'active'
    )
  );

-- ── Members ────────────────────────────────────────────────────

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('founder', 'collaborator', 'accountant')),
  equity_pct numeric(5, 2),       -- optional 0..100
  status text not null default 'active' check (status in ('active', 'inactive')),
  joined_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists idx_org_members_user on public.organization_members(user_id);
create index if not exists idx_org_members_org on public.organization_members(organization_id);

alter table public.organization_members enable row level security;

drop policy if exists "Members read own membership" on public.organization_members;
create policy "Members read own membership" on public.organization_members
  for select using (
    user_id = auth.uid() or
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "Self-join allowed" on public.organization_members;
create policy "Self-join allowed" on public.organization_members
  for insert with check (
    -- Org creators self-add as founder during setup, OR a server-side flow
    -- handles invite acceptance. For client direct insert we allow if the
    -- user is the creator of the org.
    user_id = auth.uid() and
    organization_id in (
      select id from public.organizations where created_by = auth.uid()
    )
  );

-- ── Invites ────────────────────────────────────────────────────

create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'collaborator' check (role in ('founder', 'collaborator', 'accountant')),
  invited_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  created_at timestamptz not null default now()
);

create index if not exists idx_org_invites_email on public.organization_invites(email);
create index if not exists idx_org_invites_org on public.organization_invites(organization_id);

alter table public.organization_invites enable row level security;

drop policy if exists "Members read invites" on public.organization_invites;
create policy "Members read invites" on public.organization_invites
  for select using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "Members create invites" on public.organization_invites;
create policy "Members create invites" on public.organization_invites
  for insert with check (
    invited_by = auth.uid() and
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role = 'founder' and status = 'active'
    )
  );

-- ── Governance rules (per-org) ─────────────────────────────────

create table if not exists public.organization_rules (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  expense_vote_threshold_cents int,           -- expenses > threshold need a vote
  distribution_frequency text check (distribution_frequency in ('monthly', 'quarterly', 'yearly')),
  unanimous_actions jsonb default '[]'::jsonb, -- list of action kinds requiring unanimity
  updated_at timestamptz not null default now()
);

alter table public.organization_rules enable row level security;

drop policy if exists "Members read rules" on public.organization_rules;
create policy "Members read rules" on public.organization_rules
  for select using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "Founders update rules" on public.organization_rules;
create policy "Founders update rules" on public.organization_rules
  for all using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role = 'founder' and status = 'active'
    )
  );

-- ── Decisions + Votes ──────────────────────────────────────────

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null check (kind in ('expense', 'rule_change', 'distribution', 'equity_change', 'other')),
  title text not null,
  description text,
  amount_cents int,
  created_by uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists idx_decisions_org on public.decisions(organization_id);
create index if not exists idx_decisions_status on public.decisions(organization_id, status);

alter table public.decisions enable row level security;

drop policy if exists "Members read decisions" on public.decisions;
create policy "Members read decisions" on public.decisions
  for select using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "Members create decisions" on public.decisions;
create policy "Members create decisions" on public.decisions
  for insert with check (
    created_by = auth.uid() and
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    )
  );

create table if not exists public.decision_votes (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote text not null check (vote in ('yes', 'no', 'abstain')),
  created_at timestamptz not null default now(),
  unique (decision_id, user_id)
);

alter table public.decision_votes enable row level security;

drop policy if exists "Members manage own vote" on public.decision_votes;
create policy "Members manage own vote" on public.decision_votes
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Members read votes" on public.decision_votes;
create policy "Members read votes" on public.decision_votes
  for select using (
    decision_id in (
      select id from public.decisions where organization_id in (
        select organization_id from public.organization_members
        where user_id = auth.uid() and status = 'active'
      )
    )
  );

-- ── Journal (immutable audit log) ──────────────────────────────

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_journal_org on public.journal_entries(organization_id, created_at desc);

alter table public.journal_entries enable row level security;

drop policy if exists "Members read journal" on public.journal_entries;
create policy "Members read journal" on public.journal_entries
  for select using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    )
  );

-- INSERT is allowed for members; nobody can UPDATE or DELETE (immutability)
drop policy if exists "Members append to journal" on public.journal_entries;
create policy "Members append to journal" on public.journal_entries
  for insert with check (
    actor_id = auth.uid() and
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    )
  );

-- Explicitly no UPDATE / DELETE policies → impossible to mutate or remove
