-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workspaces"
  ON public.workspaces FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add workspace_id to sections (nullable first so migration can fill it in)
ALTER TABLE public.sections ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Data migration: for each user who already has sections, create a default workspace
-- and assign all their existing sections to it.
DO $$
DECLARE
  r RECORD;
  new_ws_id UUID;
BEGIN
  FOR r IN
    SELECT DISTINCT user_id FROM public.sections WHERE workspace_id IS NULL
  LOOP
    INSERT INTO public.workspaces (user_id, name, position)
    VALUES (r.user_id, 'My Workspace', 0)
    RETURNING id INTO new_ws_id;

    UPDATE public.sections
    SET workspace_id = new_ws_id
    WHERE user_id = r.user_id AND workspace_id IS NULL;
  END LOOP;
END $$;

-- Enforce NOT NULL now that all rows are backfilled
ALTER TABLE public.sections ALTER COLUMN workspace_id SET NOT NULL;
