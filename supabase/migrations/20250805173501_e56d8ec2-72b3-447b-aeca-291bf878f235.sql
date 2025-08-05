-- Create storage bucket for sprint videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sprint-videos', 'sprint-videos', true);

-- Create storage policies for sprint videos
CREATE POLICY "Sprint videos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'sprint-videos');

CREATE POLICY "Authenticated users can upload sprint videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'sprint-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their sprint videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'sprint-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their sprint videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'sprint-videos' AND auth.role() = 'authenticated');