-- Create announcements table for storing app-wide announcements
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration date
  created_by UUID REFERENCES auth.users(id)
);

-- Create user_announcements_seen table to track which users have seen which announcements
CREATE TABLE public.user_announcements_seen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

-- Enable RLS on announcements table
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Everyone can view active announcements
CREATE POLICY "Anyone can view active announcements"
  ON public.announcements
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Enable RLS on user_announcements_seen table
ALTER TABLE public.user_announcements_seen ENABLE ROW LEVEL SECURITY;

-- Users can view their own seen announcements
CREATE POLICY "Users can view their own seen announcements"
  ON public.user_announcements_seen
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own seen announcements
CREATE POLICY "Users can insert their own seen announcements"
  ON public.user_announcements_seen
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_announcements_active ON public.announcements(is_active, expires_at);
CREATE INDEX idx_user_announcements_user_id ON public.user_announcements_seen(user_id);
CREATE INDEX idx_user_announcements_announcement_id ON public.user_announcements_seen(announcement_id);

-- Insert a sample announcement (you can modify or delete this)
-- INSERT INTO public.announcements (title, message, severity, is_active)
-- VALUES (
--   'Welcome to the Updated Priority Manager!',
--   'We''ve made some improvements to the app. Cloud sync is temporarily disabled while we upgrade our systems. Please use the "Download File" option to backup your data locally.',
--   'info',
--   true
-- );

