-- ─────────────────────────────────────────────────────────────────
-- Bloom v3 — expenses_v3 (dépenses équipe + auto-vote)
--
-- Une dépense appartient à une team et à un user (celui qui la déclare).
-- Si le montant dépasse une `governance_rule` de type `spending_threshold`,
-- on crée automatiquement une `decisions` row liée et on met le status à
-- 'pending'. Sinon → 'approved' direct.
--
-- L'auto-création de la décision est faite côté service (lib/services/
-- expenses.ts), pas en trigger : c'est plus lisible et plus testable.
--
-- RLS :
--   - lecture : membre actif de la team
--   - création : membre actif de la team (any role)
--   - update / delete : créateur OU founder de la team
-- ─────────────────────────────────────────────────────────────────

create type if not exists public.expense_status as enum (
  'pending',     -- en attente (vote en cours)
  'approved',    -- approuvée (auto ou via vote)
  'rejected',    -- rejetée via vote
  'cancelled'    -- annulée par le créateur
);

create table if not exists public.expenses_v3 (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null references public.organizations(id) on delete cascade,
  created_by      uuid not null references auth.users(id) on delete cascade,
  amount_cents    bigint not null check (amount_cents > 0),
  currency        text not null default 'EUR',
  category        text,                         -- libre, ex: 'SaaS', 'Voyage'
  description     text not null check (char_length(description) between 1 and 500),
  receipt_url     text,                         -- supabase storage URL optionnel
  status          public.expense_status not null default 'pending',
  /** Décision liée si auto-vote déclenché. NULL = pas de vote requis. */
  decision_id     uuid references public.decisions(id) on delete set null,
  /** Date de la dépense (peut différer de created_at). */
  spent_at        date not null default current_date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists expenses_v3_team_spent_idx
  on public.expenses_v3 (team_id, spent_at desc);

create index if not exists expenses_v3_created_by_idx
  on public.expenses_v3 (created_by);

create index if not exists expenses_v3_decision_idx
  on public.expenses_v3 (decision_id)
  where decision_id is not null;

create index if not exists expenses_v3_status_idx
  on public.expenses_v3 (team_id, status);

alter table public.expenses_v3 enable row level security;

-- READ : membre actif de la team
drop policy if exists "expenses_v3 read team member" on public.expenses_v3;
create policy "expenses_v3 read team member"
  on public.expenses_v3
  for select
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = expenses_v3.team_id
        and om.user_id = auth.uid()
        and om.status = 'active'
    )
  );

-- INSERT : membre actif (any role)
drop policy if exists "expenses_v3 insert member" on public.expenses_v3;
create policy "expenses_v3 insert member"
  on public.expenses_v3
  for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.organization_members om
      where om.organization_id = expenses_v3.team_id
        and om.user_id = auth.uid()
        and om.status = 'active'
    )
  );

-- UPDATE : créateur OU founder
drop policy if exists "expenses_v3 update creator or founder" on public.expenses_v3;
create policy "expenses_v3 update creator or founder"
  on public.expenses_v3
  for update
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = expenses_v3.team_id
        and om.user_id = auth.uid()
        and om.role = 'founder'
        and om.status = 'active'
    )
  )
  with check (
    auth.uid() = created_by
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = expenses_v3.team_id
        and om.user_id = auth.uid()
        and om.role = 'founder'
        and om.status = 'active'
    )
  );

-- DELETE : créateur OU founder
drop policy if exists "expenses_v3 delete creator or founder" on public.expenses_v3;
create policy "expenses_v3 delete creator or founder"
  on public.expenses_v3
  for delete
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = expenses_v3.team_id
        and om.user_id = auth.uid()
        and om.role = 'founder'
        and om.status = 'active'
    )
  );

-- Trigger updated_at
create or replace function public.expenses_v3_touch_updated()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists expenses_v3_touch_updated_trg on public.expenses_v3;
create trigger expenses_v3_touch_updated_trg
  before update on public.expenses_v3
  for each row execute function public.expenses_v3_touch_updated();
