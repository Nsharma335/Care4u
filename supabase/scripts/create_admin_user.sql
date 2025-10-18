-- ===============================================
-- CARE4U: Create Admin User Script
-- ===============================================
-- This script sets up a user as an institute admin
-- 
-- Instructions:
-- 1. Sign up/login with your email first
-- 2. Replace 'YOUR_EMAIL@example.com' with your actual email
-- 3. Replace 'Your Institute Name' with your institute name
-- 4. Run this script in Supabase SQL Editor
-- ===============================================

-- Step 1: Find the user ID by email
-- (Check the results to get the user_id)
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'YOUR_EMAIL@example.com';

-- Step 2: Update user metadata to set role (replace USER_ID with the ID from step 1)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || 
  '{"role": "institute_admin", "onboarded": true}'::jsonb
WHERE email = 'YOUR_EMAIL@example.com';

-- Step 3: Create institute_admins record (replace USER_ID)
INSERT INTO institute_admins (user_id, institute_name)
SELECT id, 'Your Institute Name'
FROM auth.users 
WHERE email = 'YOUR_EMAIL@example.com'
ON CONFLICT DO NOTHING;

-- Step 4: Verify the setup
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'role' as role,
  ia.institute_name
FROM auth.users u
LEFT JOIN institute_admins ia ON ia.user_id = u.id
WHERE u.email = 'YOUR_EMAIL@example.com';

-- ===============================================
-- That's it! Log out and log back in to see the Admin Dashboard
-- ===============================================

