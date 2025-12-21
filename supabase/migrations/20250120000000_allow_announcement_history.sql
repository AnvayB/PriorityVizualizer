-- Allow authenticated users to view all announcements for history
-- This policy allows users to see all announcements (including inactive/expired ones)
-- for the Update History feature, while the existing policy still restricts
-- which announcements are shown in the initial dialog (only active ones)

CREATE POLICY "Authenticated users can view all announcements for history"
  ON public.announcements
  FOR SELECT
  USING (auth.role() = 'authenticated');

