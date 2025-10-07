-- Create user_settings table for storing user preferences like deadline
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  deadline_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_settings
CREATE POLICY "Users can view their own settings"
  ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create completion_stats table for tracking daily completions
CREATE TABLE public.completion_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  daily_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.completion_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for completion_stats
CREATE POLICY "Users can view their own completion stats"
  ON public.completion_stats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completion stats"
  ON public.completion_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completion stats"
  ON public.completion_stats
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_completion_stats_user_date ON public.completion_stats(user_id, date);

-- Create completed_tasks table for storing task completion details
CREATE TABLE public.completed_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_title TEXT NOT NULL,
  section_title TEXT NOT NULL,
  subsection_title TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.completed_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for completed_tasks
CREATE POLICY "Users can view their own completed tasks"
  ON public.completed_tasks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed tasks"
  ON public.completed_tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completed tasks"
  ON public.completed_tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance on date queries
CREATE INDEX idx_completed_tasks_user_date ON public.completed_tasks(user_id, completed_at);

-- Add trigger for user_settings timestamps
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for completion_stats timestamps
CREATE TRIGGER update_completion_stats_updated_at
  BEFORE UPDATE ON public.completion_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();