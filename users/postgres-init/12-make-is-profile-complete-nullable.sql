-- Migration: Make isProfileComplete nullable and set NULL for admins/moderators
-- Date: 2025-12-29
-- Description: Admins and moderators don't need profiles, so isProfileComplete should be NULL for them

-- Step 1: Make the column nullable (remove NOT NULL constraint)
ALTER TABLE users ALTER COLUMN is_profile_complete DROP DEFAULT;
ALTER TABLE users ALTER COLUMN is_profile_complete DROP NOT NULL;

-- Step 2: Set default back to false for new users
ALTER TABLE users ALTER COLUMN is_profile_complete SET DEFAULT false;

-- Step 3: Update existing admins and moderators to NULL
UPDATE users u
SET is_profile_complete = NULL
WHERE u."roleId" IN (
  SELECT id FROM roles WHERE name IN ('admin', 'moderador')
);

-- Step 4: Display summary
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

-- Add comment for documentation
COMMENT ON COLUMN users.is_profile_complete IS 'Profile completion status: true = complete, false = incomplete, NULL = not applicable (admin/moderator)';
