alter table public.profiles
add column if not exists location geography(Point, 4326);