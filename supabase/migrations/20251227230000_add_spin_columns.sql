-- Add spin-related columns to game_sessions for Hard Dare bottle spinner
ALTER TABLE public.game_sessions
ADD COLUMN IF NOT EXISTS spin_result text CHECK (spin_result IN ('user_1', 'user_2')),
ADD COLUMN IF NOT EXISTS spin_initiated_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS spin_complete boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.game_sessions.spin_result IS 'Result of bottle spin for Hard Dare: user_1 or user_2';
COMMENT ON COLUMN public.game_sessions.spin_initiated_by IS 'User who initiated the spin';
COMMENT ON COLUMN public.game_sessions.spin_complete IS 'Whether the spin animation has completed';
