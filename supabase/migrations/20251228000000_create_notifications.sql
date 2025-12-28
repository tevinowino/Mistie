-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    actor_id uuid,
    type text NOT NULL CHECK (type IN ('daily_dew', 'nug', 'game_invite', 'bond_request', 'system', 'reminder')),
    title text NOT NULL,
    body text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create index for faster queries on unread items
CREATE INDEX IF NOT EXISTS notifications_user_id_is_read_idx ON public.notifications (user_id, is_read);

-- Add comments
COMMENT ON TABLE public.notifications IS 'Stores user notifications for in-app history and badge counts.';
COMMENT ON COLUMN public.notifications.actor_id IS 'Optional: ID of the user who triggered the notification (e.g. partner).';
COMMENT ON COLUMN public.notifications.data IS 'JSON payload for deep linking (e.g. { route: "/(tabs)/dew" }).';

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Only service role (or specific logic) can insert notifications usually, 
-- but we might allow users to trigger some (e.g. game invites) directly if we don't use Edge Functions for everything.
-- For now, let's allow authenticated users to insert if they are the actor (optional, but safer to stick to service role for system types).
-- Actually, Edge Functions will use Service Role, so we don't strictly need an INSERT policy for users if we route everything through backend.
-- However, for simple "Game Invite", a user might insert directly? No, plan says "Edge Function send-push".
-- So Edge Function will insert. 
-- We will add a policy for Service Role implicitly (always has access).

-- Allow users to delete their own notifications (optional cleanup)
CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);
