-- Create table to track sprint generation progress
CREATE TABLE public.sprint_generation_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  total_days INTEGER NOT NULL,
  current_day INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  form_data JSONB NOT NULL,
  master_plan JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sprint_generation_progress ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing public access for now since this is a demo/development feature)
CREATE POLICY "Allow all operations on sprint_generation_progress" 
ON public.sprint_generation_progress 
FOR ALL 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_sprint_generation_progress_updated_at
BEFORE UPDATE ON public.sprint_generation_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();