create or replace function public.update_user_location(lat double precision, lng double precision)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set location = ST_SetSRID(
    ST_MakePoint(lng, lat),
    4326
  )::geography
  where id = auth.uid();
end;
$$;