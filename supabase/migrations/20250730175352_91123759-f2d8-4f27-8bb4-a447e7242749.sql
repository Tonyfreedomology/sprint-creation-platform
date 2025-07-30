-- Create table for tracking individual user progress through sprints
CREATE TABLE public.sprint_user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id TEXT NOT NULL,
  user_token TEXT NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Add index for fast lookups
  UNIQUE(sprint_id, user_token)
);

-- Enable RLS
ALTER TABLE public.sprint_user_progress ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read and create progress records (no auth required for frictionless experience)
CREATE POLICY "Anyone can view sprint progress" 
ON public.sprint_user_progress 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create sprint progress" 
ON public.sprint_user_progress 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_sprint_user_progress_updated_at
BEFORE UPDATE ON public.sprint_user_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();