-- Add signature_data column to nda_signatures table
ALTER TABLE public.nda_signatures 
ADD COLUMN IF NOT EXISTS signature_data TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.nda_signatures.signature_data IS 'Base64 encoded signature image data for legal preservation';