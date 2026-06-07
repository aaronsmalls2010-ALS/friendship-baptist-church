-- ============================================================================
-- Migration: Email-OR-phone registration & login
--
-- Date: 2026-06-07
-- Description:
--   Members can now register and sign in with EITHER an email address OR a
--   phone number (one required, both allowed). Phone registrations are
--   verified with a 6-digit SMS code; email registrations keep the existing
--   token-link flow. Once either channel is verified the account is active
--   (auto-approved).
--
--   Changes:
--     1. profiles.email becomes nullable (phone-only members have no email).
--     2. profiles gains is_phone_verified.
--     3. Unique partial indexes on lower(email) and phone for unambiguous
--        identifier lookups at login.
--     4. New phone_verifications table holds hashed OTP codes (RLS on, so only
--        the service-role/admin client can touch it).
--     5. handle_new_user() trigger copies the auth phone and tolerates a null
--        email.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Email becomes optional
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- Normalize any historical empty-string emails to NULL so the unique index
-- below treats "no email" consistently.
UPDATE profiles SET email = NULL WHERE email = '';

-- ---------------------------------------------------------------------------
-- 2. Phone verification flag
-- ---------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Normalize any historical phone numbers to E.164 so stored values are
-- consistent (older email signups saved raw "(843) 555-0123" strings).
UPDATE profiles
SET phone = '+1' || regexp_replace(phone, '\D', '', 'g')
WHERE phone IS NOT NULL AND phone <> ''
  AND length(regexp_replace(phone, '\D', '', 'g')) = 10;

UPDATE profiles
SET phone = '+' || regexp_replace(phone, '\D', '', 'g')
WHERE phone IS NOT NULL AND phone <> ''
  AND length(regexp_replace(phone, '\D', '', 'g')) = 11
  AND left(regexp_replace(phone, '\D', '', 'g'), 1) = '1';

-- ---------------------------------------------------------------------------
-- 3. Unique partial indexes for identifier lookups
--    (auth.users already enforces uniqueness on its side; these protect our
--     own profile-based lookups and keep login unambiguous.)
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique
  ON profiles (lower(email))
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique
  ON profiles (phone)
  WHERE phone IS NOT NULL AND phone <> '';

-- ---------------------------------------------------------------------------
-- 4. OTP storage for phone verification
--    Codes are stored HASHED (sha256 of code + server pepper) — never plaintext.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS phone_verifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone        TEXT NOT NULL,                 -- E.164, e.g. +18435550123
  code_hash    TEXT NOT NULL,
  purpose      TEXT NOT NULL DEFAULT 'signup',
  attempts     INTEGER NOT NULL DEFAULT 0,
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_user
  ON phone_verifications (user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone
  ON phone_verifications (phone);

-- RLS on, with NO policies: only the service-role (admin) client can read or
-- write OTP rows. Anon/authenticated browser clients are fully denied.
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5. Trigger: copy phone from auth.users and allow a null email
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, phone, first_name, last_name)
  VALUES (
    NEW.id,
    NULLIF(NEW.email, ''),
    NULLIF(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
