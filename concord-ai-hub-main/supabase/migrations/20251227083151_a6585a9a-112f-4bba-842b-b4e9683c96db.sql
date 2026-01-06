-- Add turf_name and turf_description to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS turf_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS turf_description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS turf_images TEXT[] DEFAULT '{}';

-- Create storage bucket for turf images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('turf-images', 'turf-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for turf images bucket
CREATE POLICY "Turf images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'turf-images');

CREATE POLICY "Users can upload turf images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'turf-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their turf images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'turf-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their turf images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'turf-images' AND auth.uid() IS NOT NULL);