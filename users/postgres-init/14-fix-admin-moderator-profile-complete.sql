-- Migration: Fix isProfileComplete for all users
-- Date: 2026-01-19
-- Description: Ensure all users have correct isProfileComplete values
--              - Admins and moderators: NULL (not applicable)
--              - Regular users: true/false based on actual profile data

\echo '========================================';
\echo 'Fixing isProfileComplete for all users';
\echo '========================================';
\echo '';

-- Step 1: Fix admins and moderators (should have NULL)
\echo 'Step 1: Setting isProfileComplete = NULL for admins and moderators...';
UPDATE users u
SET is_profile_complete = NULL
WHERE u."roleId" IN (
  SELECT id FROM roles WHERE name IN ('admin', 'moderador')
)
AND u.is_profile_complete IS NOT NULL;

\echo 'Admins and moderators fixed.';
\echo '';

-- Step 2: Fix regular users with complete profiles (should have true)
\echo 'Step 2: Setting isProfileComplete = true for users with complete profiles...';
UPDATE users u
SET is_profile_complete = true
WHERE u."roleId" = (SELECT id FROM roles WHERE name = 'user')
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
  )
  AND u.is_profile_complete != true;

\echo 'Users with complete profiles fixed.';
\echo '';

-- Step 3: Fix regular users with incomplete profiles (should have false)
\echo 'Step 3: Setting isProfileComplete = false for users with incomplete profiles...';
UPDATE users u
SET is_profile_complete = false
WHERE u."roleId" = (SELECT id FROM roles WHERE name = 'user')
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
  )
  AND u.is_profile_complete != false;

\echo 'Users with incomplete profiles fixed.';
\echo '';

-- Display detailed summary
\echo '========================================';
\echo 'SUMMARY BY ROLE';
\echo '========================================';
SELECT 
  r.name as role,
  COUNT(*) as total,
  SUM(CASE WHEN u.is_profile_complete = true THEN 1 ELSE 0 END) as complete,
  SUM(CASE WHEN u.is_profile_complete = false THEN 1 ELSE 0 END) as incomplete,
  SUM(CASE WHEN u.is_profile_complete IS NULL THEN 1 ELSE 0 END) as not_applicable
FROM users u
JOIN roles r ON u."roleId" = r.id
GROUP BY r.name
ORDER BY r.name;

\echo '';
\echo '========================================';
\echo 'USERS WITH COMPLETE PROFILES (Sample)';
\echo '========================================';
SELECT 
  u.id,
  u.email,
  r.name as role,
  u.is_profile_complete,
  p.name as profile_name,
  p."lastName" as profile_lastname,
  p.profession
FROM users u
JOIN roles r ON u."roleId" = r.id
LEFT JOIN profiles p ON u."profileId" = p.id
WHERE u.is_profile_complete = true
LIMIT 5;

\echo '';
\echo '========================================';
\echo 'USERS WITH INCOMPLETE PROFILES (Sample)';
\echo '========================================';
SELECT 
  u.id,
  u.email,
  r.name as role,
  u.is_profile_complete,
  u."profileId",
  CASE 
    WHEN p.name IS NULL OR TRIM(p.name) = '' THEN 'Missing name'
    WHEN p."lastName" IS NULL OR TRIM(p."lastName") = '' THEN 'Missing lastName'
    WHEN p.profession IS NULL OR TRIM(p.profession) = '' THEN 'Missing profession'
    WHEN p."documentTypeId" IS NULL THEN 'Missing documentTypeId'
    WHEN p."documentNumber" IS NULL OR TRIM(p."documentNumber") = '' THEN 'Missing documentNumber'
    WHEN u."profileId" IS NULL THEN 'No profile'
    ELSE 'Unknown'
  END as missing_field
FROM users u
JOIN roles r ON u."roleId" = r.id
LEFT JOIN profiles p ON u."profileId" = p.id
WHERE u.is_profile_complete = false
LIMIT 10;

-- Add informative comment
COMMENT ON COLUMN users.is_profile_complete IS 'Profile completion status: true = complete, false = incomplete, NULL = not applicable (admin/moderator)';
