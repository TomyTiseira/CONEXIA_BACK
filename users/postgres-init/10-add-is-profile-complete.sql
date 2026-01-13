-- Migration: Add isProfileComplete column to users table
-- Date: 2025-12-29
-- Description: Add a boolean flag to track if user has completed their profile

-- Add the column with default false
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT false;

-- Update existing users: mark as incomplete since they have empty profiles
UPDATE users 
SET is_profile_complete = false 
WHERE is_profile_complete IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.is_profile_complete IS 'Indicates if the user has completed their profile with required fields (name, lastName, documentNumber, profession, phoneNumber)';
