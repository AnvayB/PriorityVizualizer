-- Add description column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN description text NULL;