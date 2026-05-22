-- CMS Content Management Table
CREATE TABLE IF NOT EXISTS site_content (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'richtext', 'image')),
  page TEXT NOT NULL,
  section TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index for fast page-level queries
CREATE INDEX IF NOT EXISTS idx_site_content_page ON site_content(page);

-- Enable RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Everyone can read content
CREATE POLICY "Public read access" ON site_content
  FOR SELECT USING (true);

-- Only super_admin can modify
CREATE POLICY "Super admin write access" ON site_content
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'super_admin'
    )
  );
