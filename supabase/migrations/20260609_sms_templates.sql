-- Phase 4 §#27 — SMS templates

CREATE TABLE IF NOT EXISTS public.sms_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  body        TEXT NOT NULL CHECK (char_length(body) <= 160),
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sms_templates_read ON public.sms_templates;
CREATE POLICY sms_templates_read ON public.sms_templates
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS sms_templates_write ON public.sms_templates;
CREATE POLICY sms_templates_write ON public.sms_templates
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
