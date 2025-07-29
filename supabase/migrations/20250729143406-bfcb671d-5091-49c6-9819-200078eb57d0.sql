-- Create storage bucket for sprint audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sprint-audio', 'sprint-audio', true);

-- Create storage policies for sprint audio bucket
CREATE POLICY "Anyone can view sprint audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'sprint-audio');

CREATE POLICY "Anyone can upload sprint audio files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sprint-audio');

-- Create sprints table to store generated sprint data
CREATE TABLE public.sprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  category TEXT,
  voice_id TEXT,
  creator_info JSONB NOT NULL,
  master_plan JSONB,
  daily_lessons JSONB NOT NULL,
  email_sequence JSONB NOT NULL,
  audio_files JSONB DEFAULT '{}',
  portal_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on sprints table
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read published sprints
CREATE POLICY "Anyone can view sprints"
ON public.sprints FOR SELECT
USING (true);

-- Create policy to allow anyone to insert sprints (for now)
CREATE POLICY "Anyone can create sprints"
ON public.sprints FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sprints_updated_at
BEFORE UPDATE ON public.sprints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();