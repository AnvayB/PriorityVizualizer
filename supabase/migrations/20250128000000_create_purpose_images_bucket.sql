-- Create purpose-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'purpose-images',
  'purpose-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access (for displaying images)
CREATE POLICY "Public can view purpose images"
ON storage.objects FOR SELECT
USING (bucket_id = 'purpose-images');

-- Policy: Allow authenticated users to upload their own purpose images
CREATE POLICY "Users can upload their own purpose images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'purpose-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update their own purpose images
CREATE POLICY "Users can update their own purpose images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'purpose-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'purpose-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own purpose images
CREATE POLICY "Users can delete their own purpose images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'purpose-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

