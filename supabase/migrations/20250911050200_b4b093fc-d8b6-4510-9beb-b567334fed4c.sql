-- Create tables for priorities management
CREATE TABLE public.sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.subsections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subsection_id UUID NOT NULL REFERENCES public.subsections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subsections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for sections
CREATE POLICY "Users can view their own sections" 
ON public.sections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sections" 
ON public.sections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sections" 
ON public.sections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sections" 
ON public.sections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for subsections
CREATE POLICY "Users can view subsections of their sections" 
ON public.subsections 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.sections 
  WHERE sections.id = subsections.section_id 
  AND sections.user_id = auth.uid()
));

CREATE POLICY "Users can create subsections for their sections" 
ON public.subsections 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.sections 
  WHERE sections.id = subsections.section_id 
  AND sections.user_id = auth.uid()
));

CREATE POLICY "Users can update subsections of their sections" 
ON public.subsections 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.sections 
  WHERE sections.id = subsections.section_id 
  AND sections.user_id = auth.uid()
));

CREATE POLICY "Users can delete subsections of their sections" 
ON public.subsections 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.sections 
  WHERE sections.id = subsections.section_id 
  AND sections.user_id = auth.uid()
));

-- Create policies for tasks
CREATE POLICY "Users can view tasks in their subsections" 
ON public.tasks 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.subsections 
  JOIN public.sections ON sections.id = subsections.section_id
  WHERE subsections.id = tasks.subsection_id 
  AND sections.user_id = auth.uid()
));

CREATE POLICY "Users can create tasks in their subsections" 
ON public.tasks 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.subsections 
  JOIN public.sections ON sections.id = subsections.section_id
  WHERE subsections.id = tasks.subsection_id 
  AND sections.user_id = auth.uid()
));

CREATE POLICY "Users can update tasks in their subsections" 
ON public.tasks 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.subsections 
  JOIN public.sections ON sections.id = subsections.section_id
  WHERE subsections.id = tasks.subsection_id 
  AND sections.user_id = auth.uid()
));

CREATE POLICY "Users can delete tasks in their subsections" 
ON public.tasks 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.subsections 
  JOIN public.sections ON sections.id = subsections.section_id
  WHERE subsections.id = tasks.subsection_id 
  AND sections.user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subsections_updated_at
  BEFORE UPDATE ON public.subsections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();