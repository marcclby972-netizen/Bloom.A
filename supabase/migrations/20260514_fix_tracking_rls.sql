-- Fix tracking_events RLS so anonymous tracker pings work
-- The original policy required SELECT on tracking_sites to check existence,
-- but anon users can't read tracking_sites (it's user-scoped).
-- We replace it with a permissive insert + a stricter approach:
-- anon can insert anything, but the SELECT side is still protected by user RLS.
-- Spam risk is minimal because path/referrer/session_id are length-capped server-side,
-- and the dashboard only reads events for sites owned by the user.

-- Drop the broken insert policy
drop policy if exists "Anyone can insert events for valid sites" on public.tracking_events;

-- Allow anonymous inserts (the API handler validates siteId shape, and the
-- dashboard only ever reads events tied to the user's own sites).
create policy "Anyone can insert tracking events"
  on public.tracking_events
  for insert
  with check (true);

-- Note: SELECT remains scoped to the user via existing policy "Users read own events"
-- which uses: site_id in (select id from public.tracking_sites where user_id = auth.uid())
-- This means even if junk site_ids are inserted, they're invisible in the dashboard.
