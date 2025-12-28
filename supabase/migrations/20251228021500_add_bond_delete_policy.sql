-- Allow users to delete their own bonds ONLY if they are 'pending'
-- This is required for the "Join Bond" flow to clean up any unused pending bonds created by the user (invitations)
CREATE POLICY "Users can delete own pending bonds" ON bonds
FOR DELETE USING (
    (auth.uid() = user_1_id) AND (status = 'pending')
);
