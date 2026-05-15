-- Drop the LinkedIn Studio table — feature removed from the app.
-- The /studio page, /api/linkedin/posts*, /api/linkedin/generate, and the
-- publish-scheduled cron job have all been deleted from the codebase.
-- Personal-account LinkedIn posting via API was rolled back; only the
-- OAuth integration (account connect/disconnect) remains.

drop table if exists public.linkedin_posts cascade;
