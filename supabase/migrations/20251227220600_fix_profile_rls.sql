-- Fix RLS policy for profiles UPDATE
-- Drop existing policy and recreate with proper USING and WITH CHECK clauses

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Also ensure the columns we're updating don't have issues
-- Grant explicit update permissions on new columns
GRANT UPDATE ON profiles TO authenticated;
