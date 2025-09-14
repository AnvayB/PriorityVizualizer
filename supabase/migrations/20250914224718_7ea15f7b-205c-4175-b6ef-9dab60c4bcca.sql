-- Add color column to sections to persist section color selections
ALTER TABLE public.sections
ADD COLUMN IF NOT EXISTS color TEXT;