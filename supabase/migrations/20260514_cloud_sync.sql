-- Bloom cloud sync — full schema for cross-device data
-- Run this migration on your Supabase project via the SQL editor.

-- ── Helper: updated_at trigger ──
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── Categories ──
create table if not exists public.categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists categories_user_id_idx on public.categories(user_id);
alter table public.categories enable row level security;
drop policy if exists "Users manage own categories" on public.categories;
create policy "Users manage own categories" on public.categories for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Tasks ──
create table if not exists public.tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  category_id text,
  tags text[] default '{}',
  date text,
  start_time text,
  end_time text,
  status text default 'planned',
  project_id text,
  linked_todo_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_date_idx on public.tasks(date);
alter table public.tasks enable row level security;
drop policy if exists "Users manage own tasks" on public.tasks;
create policy "Users manage own tasks" on public.tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Todos ──
create table if not exists public.todos (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  done boolean default false,
  date text,
  priority text default 'medium',
  project_id text,
  linked_task_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists todos_user_id_idx on public.todos(user_id);
alter table public.todos enable row level security;
drop policy if exists "Users manage own todos" on public.todos;
create policy "Users manage own todos" on public.todos for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Contacts ──
create table if not exists public.contacts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text default '',
  last_name text default '',
  phone text default '',
  email text default '',
  instagram text default '',
  status text default 'prospect',
  source text default '',
  notes text default '',
  tags text[] default '{}',
  category_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contacts_user_id_idx on public.contacts(user_id);
alter table public.contacts enable row level security;
drop policy if exists "Users manage own contacts" on public.contacts;
create policy "Users manage own contacts" on public.contacts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Interactions ──
create table if not exists public.interactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id text not null,
  channel text not null,
  direction text not null,
  summary text default '',
  date bigint not null,
  created_at timestamptz not null default now()
);
create index if not exists interactions_user_id_idx on public.interactions(user_id);
create index if not exists interactions_contact_id_idx on public.interactions(contact_id);
alter table public.interactions enable row level security;
drop policy if exists "Users manage own interactions" on public.interactions;
create policy "Users manage own interactions" on public.interactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Posts ──
create table if not exists public.posts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  type text not null default 'organic',
  title text default '',
  content text default '',
  published_at text,
  metrics jsonb default '{}',
  tags text[] default '{}',
  category_id text,
  project_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_user_id_idx on public.posts(user_id);
alter table public.posts enable row level security;
drop policy if exists "Users manage own posts" on public.posts;
create policy "Users manage own posts" on public.posts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Projects ──
create table if not exists public.projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  status text default 'idea',
  tags text[] default '{}',
  linked_task_ids text[] default '{}',
  linked_contact_ids text[] default '{}',
  linked_post_ids text[] default '{}',
  revenue numeric default 0,
  collaborators text[] default '{}',
  category_id text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_id_idx on public.projects(user_id);
alter table public.projects enable row level security;
drop policy if exists "Users manage own projects" on public.projects;
create policy "Users manage own projects" on public.projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Project Notes ──
create table if not exists public.project_notes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  parent_id text,
  title text default '',
  content text default '',
  "order" int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists project_notes_user_id_idx on public.project_notes(user_id);
create index if not exists project_notes_project_id_idx on public.project_notes(project_id);
alter table public.project_notes enable row level security;
drop policy if exists "Users manage own project notes" on public.project_notes;
create policy "Users manage own project notes" on public.project_notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Vocal Projects ──
create table if not exists public.vocal_projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  keywords text[] default '{}',
  created_at timestamptz not null default now()
);
create index if not exists vocal_projects_user_id_idx on public.vocal_projects(user_id);
alter table public.vocal_projects enable row level security;
drop policy if exists "Users manage own vocal projects" on public.vocal_projects;
create policy "Users manage own vocal projects" on public.vocal_projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Vocal Notes ──
create table if not exists public.vocal_notes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  transcript text default '',
  linked_project_id text,
  linked_contact_id text,
  created_at timestamptz not null default now()
);
create index if not exists vocal_notes_user_id_idx on public.vocal_notes(user_id);
create index if not exists vocal_notes_project_id_idx on public.vocal_notes(project_id);
alter table public.vocal_notes enable row level security;
drop policy if exists "Users manage own vocal notes" on public.vocal_notes;
create policy "Users manage own vocal notes" on public.vocal_notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Prompt Notes ──
create table if not exists public.prompt_notes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  vocal_note_ids text[] default '{}',
  content text default '',
  used boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists prompt_notes_user_id_idx on public.prompt_notes(user_id);
create index if not exists prompt_notes_project_id_idx on public.prompt_notes(project_id);
alter table public.prompt_notes enable row level security;
drop policy if exists "Users manage own prompt notes" on public.prompt_notes;
create policy "Users manage own prompt notes" on public.prompt_notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Time Entries ──
create table if not exists public.time_entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text,
  started_at bigint not null,
  ended_at bigint,
  duration int default 0,
  mode text default 'stopwatch',
  countdown_duration int,
  created_at timestamptz not null default now()
);
create index if not exists time_entries_user_id_idx on public.time_entries(user_id);
create index if not exists time_entries_task_id_idx on public.time_entries(task_id);
alter table public.time_entries enable row level security;
drop policy if exists "Users manage own time entries" on public.time_entries;
create policy "Users manage own time entries" on public.time_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Goals ──
create table if not exists public.goals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id text not null,
  target_minutes_per_day int default 0,
  created_at timestamptz not null default now()
);
create index if not exists goals_user_id_idx on public.goals(user_id);
alter table public.goals enable row level security;
drop policy if exists "Users manage own goals" on public.goals;
create policy "Users manage own goals" on public.goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── User Settings (single row per user, JSONB blob for flexibility) ──
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.user_settings enable row level security;
drop policy if exists "Users manage own settings" on public.user_settings;
create policy "Users manage own settings" on public.user_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
