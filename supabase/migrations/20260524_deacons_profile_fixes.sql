-- ============================================================================
-- Migration: Deacon standalone fields + Profile column fixes + Seed data
--
-- Date: 2026-05-24
-- Description:
--   1. Make deacons.profile_id nullable (support deacons without user accounts)
--   2. Add first_name, last_name, phone columns to deacons table
--   3. Ensure profiles.gender column exists
--   4. Create wards 1-6 if they don't exist
--   5. Seed real deacon data
-- ============================================================================


-- ============================================================================
-- 1. PROFILES: ensure gender column exists
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT
  CHECK (gender IN ('male', 'female', 'other'));


-- ============================================================================
-- 2. DEACONS: make profile_id nullable and add standalone fields
-- ============================================================================

-- Drop the NOT NULL constraint on profile_id so deacons can exist without accounts
ALTER TABLE deacons ALTER COLUMN profile_id DROP NOT NULL;

-- Add standalone name/phone columns for deacons without user profiles
ALTER TABLE deacons ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE deacons ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE deacons ADD COLUMN IF NOT EXISTS phone TEXT;


-- ============================================================================
-- 3. CREATE WARDS 1-6
-- ============================================================================

INSERT INTO wards (id, name, description)
VALUES
  (gen_random_uuid(), 'Ward 1', 'Ward 1 families')
ON CONFLICT DO NOTHING;

INSERT INTO wards (id, name, description)
VALUES
  (gen_random_uuid(), 'Ward 2', 'Ward 2 families')
ON CONFLICT DO NOTHING;

INSERT INTO wards (id, name, description)
VALUES
  (gen_random_uuid(), 'Ward 3', 'Ward 3 families')
ON CONFLICT DO NOTHING;

INSERT INTO wards (id, name, description)
VALUES
  (gen_random_uuid(), 'Ward 4', 'Ward 4 families')
ON CONFLICT DO NOTHING;

INSERT INTO wards (id, name, description)
VALUES
  (gen_random_uuid(), 'Ward 5', 'Ward 5 families')
ON CONFLICT DO NOTHING;

INSERT INTO wards (id, name, description)
VALUES
  (gen_random_uuid(), 'Ward 6', 'Ward 6 families')
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 4. SEED DEACON DATA
-- ============================================================================

-- Ward 1 & 2: Deacon Edward Simmons
INSERT INTO deacons (first_name, last_name, phone, ward_id, is_active, title)
SELECT 'Edward', 'Simmons', '(646) 201-0833',
       w.id, TRUE, NULL
FROM wards w WHERE w.name = 'Ward 1'
ON CONFLICT DO NOTHING;

-- Ward 1 & 2: Deacon Emeritus Mikell Seigler
INSERT INTO deacons (first_name, last_name, phone, ward_id, is_active, title)
SELECT 'Mikell', 'Seigler', '843-812-4321',
       w.id, TRUE, 'Emeritus'
FROM wards w WHERE w.name = 'Ward 1'
ON CONFLICT DO NOTHING;

-- Ward 3: Deacon Leon Moultrie
INSERT INTO deacons (first_name, last_name, phone, ward_id, is_active, title)
SELECT 'Leon', 'Moultrie', NULL,
       w.id, TRUE, NULL
FROM wards w WHERE w.name = 'Ward 3'
ON CONFLICT DO NOTHING;

-- Ward 4: Deacon Terry Grant
INSERT INTO deacons (first_name, last_name, phone, ward_id, is_active, title)
SELECT 'Terry', 'Grant', '(843) 271-4581',
       w.id, TRUE, NULL
FROM wards w WHERE w.name = 'Ward 4'
ON CONFLICT DO NOTHING;

-- Ward 4: Deacon Emeritus Horace Brisbane
INSERT INTO deacons (first_name, last_name, phone, ward_id, is_active, title)
SELECT 'Horace', 'Brisbane', NULL,
       w.id, TRUE, 'Emeritus'
FROM wards w WHERE w.name = 'Ward 4'
ON CONFLICT DO NOTHING;

-- Ward 5: Deacon Oscar Smalls
INSERT INTO deacons (first_name, last_name, phone, ward_id, is_active, title)
SELECT 'Oscar', 'Smalls', '843-263-0027',
       w.id, TRUE, NULL
FROM wards w WHERE w.name = 'Ward 5'
ON CONFLICT DO NOTHING;

-- Ward 5: Deacon Cecil Gwyn
INSERT INTO deacons (first_name, last_name, phone, ward_id, is_active, title)
SELECT 'Cecil', 'Gwyn', '912-344-0500',
       w.id, TRUE, NULL
FROM wards w WHERE w.name = 'Ward 5'
ON CONFLICT DO NOTHING;

-- Ward 6: Deacon Aaron Smalls
INSERT INTO deacons (first_name, last_name, phone, ward_id, is_active, title)
SELECT 'Aaron', 'Smalls', '843-263-0072',
       w.id, TRUE, NULL
FROM wards w WHERE w.name = 'Ward 6'
ON CONFLICT DO NOTHING;
