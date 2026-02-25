create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    username,
    location,
    created_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'username', ''),
    case
      when new.raw_user_meta_data->>'latitude' is not null
       and new.raw_user_meta_data->>'longitude' is not null
      then
        ST_SetSRID(
          ST_MakePoint(
            (new.raw_user_meta_data->>'longitude')::double precision,
            (new.raw_user_meta_data->>'latitude')::double precision
          ),
          4326
        )::geography
      else null
    end,
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;