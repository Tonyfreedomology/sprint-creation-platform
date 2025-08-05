-- Add video_files column to sprints table
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS video_files JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN sprints.video_files IS 'JSON object mapping day numbers to video file URLs (e.g., {"1": "https://...", "2": "https://..."})';

-- Create storage bucket for video files if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sprint-videos',
  'sprint-videos', 
  true,
  52428800, -- 50MB limit per video
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for video bucket
CREATE POLICY "Public video access" ON storage.objects
FOR SELECT USING (bucket_id = 'sprint-videos');

CREATE POLICY "Authenticated video upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'sprint-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated video update" ON storage.objects
FOR UPDATE USING (bucket_id = 'sprint-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated video delete" ON storage.objects
FOR DELETE USING (bucket_id = 'sprint-videos' AND auth.role() = 'authenticated');