-- ============================================================================
-- Migration: Add SMS opt-in and preference columns to profiles
--
-- Date: 2026-05-26
-- Description:
--   Adds sms_opt_in, email_notifications, and public_directory columns
--   to the profiles table so member preferences persist in the database.
--   SMS messages will only be sent to members with sms_opt_in = true.
-- ============================================================================

-- Add sms_opt_in column (default true — members are opted in at signup and can opt out)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN NOT NULL DEFAULT true;

-- Opt in all existing members who have a phone number
UPDATE profiles SET sms_opt_in = true WHERE phone IS NOT NULL AND phone != '';

-- Add email_notifications column (default true)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT true;

-- Add public_directory column (default true)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_directory BOOLEAN NOT NULL DEFAULT true;

-- Index for quick SMS recipient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_sms_opt_in ON profiles(sms_opt_in) WHERE sms_opt_in = true;
