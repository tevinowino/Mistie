-- Add anniversary_date column to bonds table
ALTER TABLE public.bonds 
ADD COLUMN IF NOT EXISTS anniversary_date DATE;

-- Comment on column
COMMENT ON COLUMN public.bonds.anniversary_date IS 'Optional date when the relationship started (Anniversary)';
