-- Add high_priority column to sections, subsections, and tasks tables
ALTER TABLE public.sections 
ADD COLUMN IF NOT EXISTS high_priority BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.subsections 
ADD COLUMN IF NOT EXISTS high_priority BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS high_priority BOOLEAN NOT NULL DEFAULT false;