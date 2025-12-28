-- Update DELETE policy for bonds table
-- Allow users to delete their own bonds regardless of status (pending or couple)

-- Drop existing DELETE policy if it exists (usually it's "Users can delete own pending bonds")
DROP POLICY IF EXISTS "Users can delete own pending bonds" ON public.bonds;
DROP POLICY IF EXISTS "Users can delete their own bonds" ON public.bonds;

-- Create new policy allowing deletion if user is either user_1 or user_2
CREATE POLICY "Users can delete their own bonds"
ON public.bonds
FOR DELETE
USING (
  auth.uid() = user_1_id OR 
  auth.uid() = user_2_id
);

-- Note: We are relying on client-side (service layer) manual cleanup for related tables
-- because we don't assume CASCADE DELETE is set up on all foreign keys.
-- However, strict RLS on related tables might block deletion if we relied solely on CASCADE.
-- The service layer approach ensures we explicitly remove data we have access to.
