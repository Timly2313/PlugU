CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  raw jsonb := NEW.raw_user_meta_data;
  username_val text;
BEGIN
  -- Generate username safely
  username_val := split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 5);

  -- Insert into profiles (NO location coordinates)
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    email,
    phone,
    created_at
  )
  VALUES (
    NEW.id,
    username_val,
    COALESCE(raw->>'full_name', 'User'),
    NEW.email,
    COALESCE(raw->>'phone', ''),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();