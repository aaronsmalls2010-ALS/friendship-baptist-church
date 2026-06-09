-- Phase 3 §#16 — Pastoral care notes (restricted)

CREATE TABLE IF NOT EXISTS public.care_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_care_notes_profile ON public.care_notes(profile_id);
CREATE INDEX IF NOT EXISTS idx_care_notes_author  ON public.care_notes(author_id);

ALTER TABLE public.care_notes ENABLE ROW LEVEL SECURITY;

-- Only pastor, super_admin, and the ward deacon for this member can read
DROP POLICY IF EXISTS care_notes_read ON public.care_notes;
CREATE POLICY care_notes_read ON public.care_notes
  FOR SELECT USING (
    public.is_finance_team()  -- super_admin, pastor (finance_team includes pastor)
    OR author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.profiles me ON me.id = auth.uid()
      WHERE p.id = care_notes.profile_id
        AND p.ward_id IS NOT NULL
        AND me.ward_id = p.ward_id
        AND EXISTS (
          SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'deacon'
        )
    )
  );

-- Authors can insert their own notes; pastor/super_admin can insert for anyone
DROP POLICY IF EXISTS care_notes_insert ON public.care_notes;
CREATE POLICY care_notes_insert ON public.care_notes
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND (
      public.is_finance_team()
      OR EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'deacon'
      )
    )
  );

-- Authors can update their own; admins can update any
DROP POLICY IF EXISTS care_notes_update ON public.care_notes;
CREATE POLICY care_notes_update ON public.care_notes
  FOR UPDATE USING (author_id = auth.uid() OR public.is_super_admin());

-- Authors can delete their own; super_admin can delete any
DROP POLICY IF EXISTS care_notes_delete ON public.care_notes;
CREATE POLICY care_notes_delete ON public.care_notes
  FOR DELETE USING (author_id = auth.uid() OR public.is_super_admin());
