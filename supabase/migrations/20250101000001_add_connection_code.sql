-- Add connection_code to bonds for the pairing handshake
ALTER TABLE public.bonds 
ADD COLUMN connection_code text UNIQUE;

-- Index for faster lookup by code
CREATE INDEX idx_bonds_connection_code ON public.bonds(connection_code);
