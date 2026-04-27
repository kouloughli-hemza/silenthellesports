-- Add a highlight reel URL to each player. Single field — the public page
-- detects whether it's a YouTube or TikTok URL and renders the right embed.
alter table public.players
  add column if not exists highlight_url text;
