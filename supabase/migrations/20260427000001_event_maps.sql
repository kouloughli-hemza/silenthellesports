-- Allow up to 5 maps per event. Adds a `maps jsonb` array alongside the legacy
-- single-map text column so old reads keep working during the rollout.
alter table public.events
  add column if not exists maps jsonb not null default '[]'::jsonb;

-- Backfill: any existing event with a single map text gets it lifted into the array.
update public.events
   set maps = jsonb_build_array(map)
 where coalesce(map, '') <> ''
   and (maps is null or jsonb_array_length(maps) = 0);
