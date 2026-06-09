-- Phase 1 §1.2 — Add finance + pastor roles
-- Enum values cannot be removed; confirm spellings before running.

DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'finance' AFTER 'musician';
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'pastor' AFTER 'finance';
EXCEPTION WHEN others THEN NULL;
END $$;

-- Update is_admin() so pastor can reach /admin (pastor is admin-level)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'pastor')
  );
$fn$;

-- Update is_finance_team() to use the real finance role
-- (still keeps the Finance Committee ministry membership fallback for backward compat)
CREATE OR REPLACE FUNCTION public.is_finance_team()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('finance', 'pastor', 'super_admin')
  );
$fn$;
