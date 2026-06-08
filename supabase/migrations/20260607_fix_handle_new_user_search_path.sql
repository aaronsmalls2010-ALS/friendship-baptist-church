-- ============================================================================
-- Fix: handle_new_user search_path
--
-- Date: 2026-06-07
-- The handle_new_user trigger runs as SECURITY DEFINER but had no pinned
-- search_path. The Supabase auth service connects with a search_path that does
-- NOT include `public`, so the trigger's `INSERT INTO profiles` could not
-- resolve the table and every new signup failed with
-- "Database error creating new user".
--
-- Fix: pin `search_path = ''` and fully schema-qualify the target table. This
-- is also the pattern the Supabase security advisor recommends for all
-- SECURITY DEFINER functions.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, first_name, last_name)
  VALUES (
    NEW.id,
    NULLIF(NEW.email, ''),
    NULLIF(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$;
