-- Allow tactic boards to exist before a map image is uploaded. The public
-- component renders a stylized grid placeholder when the image is missing.
alter table public.tactic_boards
  alter column map_image_url drop not null;
