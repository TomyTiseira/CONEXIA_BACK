-- Migration: Update isProfileComplete for existing users based on their actual profile data
-- Date: 2025-12-29
-- Description: Check if existing users have completed their profiles and update the flag accordingly

-- Update users who have completed their profile
-- A profile is considered complete when all required fields are filled:
-- 1. name (not null and not empty)
-- 2. lastName (not null and not empty)
-- 3. profession (not null and not empty)
-- 4. documentTypeId (not null)
-- 5. documentNumber (not null and not empty)
-- IMPORTANT: Exclude admins (roleId=1) and moderators (roleId=3) as they don't need profiles

UPDATE users u
SET is_profile_complete = true
WHERE u."roleId" NOT IN (
    SELECT id FROM roles WHERE name IN ('admin', 'moderador')
  )
  AND u."profileId" IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM profiles p 
    WHERE p.id = u."profileId"
      AND p.name IS NOT NULL 
      AND TRIM(p.name) != ''
      AND p."lastName" IS NOT NULL 
      AND TRIM(p."lastName") != ''
      AND p.profession IS NOT NULL 
      AND TRIM(p.profession) != ''
      AND p."documentTypeId" IS NOT NULL
      AND p."documentNumber" IS NOT NULL 
      AND TRIM(p."documentNumber") != ''
  );

-- Update users who have incomplete profiles or no profile
-- IMPORTANT: Exclude admins (roleId=1) and moderators (roleId=3) as they don't need profiles
UPDATE users u
SET is_profile_complete = false
WHERE u."roleId" NOT IN (
    SELECT id FROM roles WHERE name IN ('admin', 'moderador')
  )
  AND (
    u."profileId" IS NULL
    OR NOT EXISTS (
      SELECT 1 
      FROM profiles p 
      WHERE p.id = u."profileId"
        AND p.name IS NOT NULL 
        AND TRIM(p.name) != ''
        AND p."lastName" IS NOT NULL 
        AND TRIM(p."lastName") != ''
        AND p.profession IS NOT NULL 
        AND TRIM(p.profession) != ''
        AND p."documentTypeId" IS NOT NULL
        AND p."documentNumber" IS NOT NULL 
        AND TRIM(p."documentNumber") != ''
    )
  );

-- Display summary of the update
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN is_profile_complete = true THEN 1 ELSE 0 END) as complete_profiles,
  SUM(CASE WHEN is_profile_complete = false THEN 1 ELSE 0 END) as incomplete_profiles,
  ROUND(100.0 * SUM(CASE WHEN is_profile_complete = true THEN 1 ELSE 0 END) / COUNT(*), 2) as completion_percentage
FROM users;
