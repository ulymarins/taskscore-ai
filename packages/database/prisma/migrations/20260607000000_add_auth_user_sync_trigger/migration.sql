-- Trigger function: syncs auth.users → public.users on INSERT or UPDATE.
-- SECURITY DEFINER lets it write to public schema with elevated privileges.
CREATE OR REPLACE FUNCTION public.handle_auth_user_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, "avatarUrl", role, "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url',
    'COMMUNITY',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email       = EXCLUDED.email,
    name        = EXCLUDED.name,
    "avatarUrl" = EXCLUDED."avatarUrl",
    "updatedAt" = NOW();
  RETURN NEW;
END;
$$;

-- Fire on new registrations
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_auth_user_change();

-- Fire on profile updates (email change, metadata update)
CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_auth_user_change();
