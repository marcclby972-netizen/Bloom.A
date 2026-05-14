-- Project collaborations + in-app notifications
-- Run on Supabase SQL Editor.

-- ── Notifications ──
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- 'project_invite', 'project_invite_accepted', 'project_invite_rejected', etc.
  title text not null,
  body text,
  action_payload jsonb default '{}',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_unread_idx on public.notifications(user_id, read) where read = false;
alter table public.notifications enable row level security;
drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications
  for select using (auth.uid() = user_id);
drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users delete own notifications" on public.notifications;
create policy "Users delete own notifications" on public.notifications
  for delete using (auth.uid() = user_id);
-- Inserts go through SECURITY DEFINER function below so any authenticated user
-- can create a notification for another user (needed for invitations).

-- ── Project Collaborators ──
create table if not exists public.project_collaborators (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  collaborator_user_id uuid not null references auth.users(id) on delete cascade,
  collaborator_email text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (project_id, collaborator_user_id)
);
create index if not exists project_collaborators_project_idx on public.project_collaborators(project_id);
create index if not exists project_collaborators_collab_idx on public.project_collaborators(collaborator_user_id, status);
alter table public.project_collaborators enable row level security;

-- Owner can manage invites for their own projects
drop policy if exists "Owner manages invites" on public.project_collaborators;
create policy "Owner manages invites" on public.project_collaborators
  for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

-- Collaborator can read their own invites
drop policy if exists "Collaborator reads invites" on public.project_collaborators;
create policy "Collaborator reads invites" on public.project_collaborators
  for select using (auth.uid() = collaborator_user_id);

-- Collaborator can update their own invite (accept/reject)
drop policy if exists "Collaborator responds invites" on public.project_collaborators;
create policy "Collaborator responds invites" on public.project_collaborators
  for update using (auth.uid() = collaborator_user_id)
  with check (auth.uid() = collaborator_user_id);

-- ── Helper SECURITY DEFINER function: invite a user by email ──
create or replace function public.invite_project_collaborator(
  p_project_id text,
  p_email text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid := auth.uid();
  v_invitee_id uuid;
  v_owner_name text;
  v_invite_id uuid;
begin
  if v_owner_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Find the invitee user by email (case-insensitive)
  select id into v_invitee_id from auth.users where lower(email) = lower(p_email) limit 1;
  if v_invitee_id is null then
    return json_build_object('ok', false, 'error', 'no_such_user');
  end if;
  if v_invitee_id = v_owner_id then
    return json_build_object('ok', false, 'error', 'cant_invite_self');
  end if;

  -- Check the project exists and belongs to the inviter
  if not exists (select 1 from public.projects where id = p_project_id and user_id = v_owner_id) then
    return json_build_object('ok', false, 'error', 'not_owner');
  end if;

  -- Check duplicate
  if exists (select 1 from public.project_collaborators where project_id = p_project_id and collaborator_user_id = v_invitee_id) then
    return json_build_object('ok', false, 'error', 'already_invited');
  end if;

  -- Get owner name for the notification
  select coalesce(raw_user_meta_data->>'name', email) into v_owner_name from auth.users where id = v_owner_id;

  -- Insert the invite
  insert into public.project_collaborators (project_id, owner_user_id, collaborator_user_id, collaborator_email, status)
  values (p_project_id, v_owner_id, v_invitee_id, p_email, 'pending')
  returning id into v_invite_id;

  -- Create notification for the invitee
  insert into public.notifications (user_id, type, title, body, action_payload)
  values (
    v_invitee_id,
    'project_invite',
    'Invitation à un projet',
    coalesce(v_owner_name, 'Quelqu''un') || ' t''invite à rejoindre un projet sur Bloom',
    json_build_object('invite_id', v_invite_id, 'project_id', p_project_id, 'owner_user_id', v_owner_id)::jsonb
  );

  return json_build_object('ok', true, 'invite_id', v_invite_id);
end;
$$;

grant execute on function public.invite_project_collaborator(text, text) to authenticated;

-- ── Helper SECURITY DEFINER function: respond to an invite ──
create or replace function public.respond_project_invite(
  p_invite_id uuid,
  p_accept boolean
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite record;
  v_project_name text;
  v_collab_name text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Fetch the invite
  select * into v_invite from public.project_collaborators where id = p_invite_id and collaborator_user_id = v_user_id;
  if v_invite is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_invite.status <> 'pending' then
    return json_build_object('ok', false, 'error', 'already_responded');
  end if;

  -- Update status
  update public.project_collaborators
  set status = case when p_accept then 'accepted' else 'rejected' end,
      responded_at = now()
  where id = p_invite_id;

  -- Mark related notifications as read
  update public.notifications
  set read = true
  where user_id = v_user_id
    and (action_payload->>'invite_id')::uuid = p_invite_id;

  -- Notify the owner of the response
  select name into v_project_name from public.projects where id = v_invite.project_id;
  select coalesce(raw_user_meta_data->>'name', email) into v_collab_name from auth.users where id = v_user_id;
  insert into public.notifications (user_id, type, title, body, action_payload)
  values (
    v_invite.owner_user_id,
    case when p_accept then 'project_invite_accepted' else 'project_invite_rejected' end,
    case when p_accept then 'Invitation acceptée' else 'Invitation refusée' end,
    coalesce(v_collab_name, 'Quelqu''un') || (case when p_accept then ' a rejoint ' else ' a refusé ' end) || coalesce(v_project_name, 'votre projet'),
    json_build_object('project_id', v_invite.project_id, 'collaborator_user_id', v_user_id)::jsonb
  );

  return json_build_object('ok', true);
end;
$$;

grant execute on function public.respond_project_invite(uuid, boolean) to authenticated;

-- ── Update projects RLS to allow collaborators to read shared projects ──
drop policy if exists "Users manage own projects" on public.projects;
drop policy if exists "Users see own + collaborated projects" on public.projects;
drop policy if exists "Users edit own projects" on public.projects;
drop policy if exists "Users update own + collaborated projects" on public.projects;
drop policy if exists "Users delete own projects" on public.projects;

create policy "Users see own + collaborated projects" on public.projects
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.project_collaborators pc
      where pc.project_id = projects.id
        and pc.collaborator_user_id = auth.uid()
        and pc.status = 'accepted'
    )
  );

create policy "Users insert own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users update own + collaborated projects" on public.projects
  for update using (
    auth.uid() = user_id
    or exists (
      select 1 from public.project_collaborators pc
      where pc.project_id = projects.id
        and pc.collaborator_user_id = auth.uid()
        and pc.status = 'accepted'
    )
  );

create policy "Users delete own projects" on public.projects
  for delete using (auth.uid() = user_id);
