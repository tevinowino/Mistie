-- Add gender column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Male', 'Female', 'Non-Binary', 'Prefer not to say'));

COMMENT ON COLUMN public.profiles.gender IS 'User gender for personalization';
