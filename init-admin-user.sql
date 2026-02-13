-- Initialize Admin User (User ID: 1)
-- This script creates the top-level admin account for the DreamSource platform

-- 1. Insert admin user
INSERT INTO users (
  openId,
  name,
  email,
  loginMethod,
  role,
  inviteCode,
  invitePath,
  directCount,
  isActivated,
  createdAt,
  updatedAt,
  lastSignedIn
) VALUES (
  'admin-001',
  'Administrator',
  'admin@dreamsource.com',
  'admin',
  'admin',
  'ADMIN001',
  '1',
  0,
  true,
  NOW(),
  NOW(),
  NOW()
);

-- 2. Insert initial assets for admin user
INSERT INTO assets (
  user_id,
  available_balance,
  frozen_balance,
  total_commission,
  monthly_income,
  monthly_expense,
  createdAt,
  updatedAt
) VALUES (
  1,
  '1000000.00',
  '0.00',
  '0.00',
  '0.00',
  '0.00',
  NOW(),
  NOW()
);

-- 3. Verify the creation
SELECT 
  u.id,
  u.openId,
  u.name,
  u.role,
  u.isActivated,
  a.available_balance,
  a.frozen_balance
FROM users u
LEFT JOIN assets a ON u.id = a.user_id
WHERE u.id = 1;
