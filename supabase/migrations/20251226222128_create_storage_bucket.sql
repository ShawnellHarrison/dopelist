/*
  # Create storage bucket for post images

  ## Changes
  1. Create a storage bucket named 'post-images' for storing classified ad images
  2. Set up RLS policies to allow:
     - Authenticated users (including anonymous) to upload images
     - Public read access to all images
     - Users can delete their own images (based on user_id in path)

  ## Security
  - Public read access for all images (classifieds need to be publicly viewable)
  - Upload restricted to authenticated users
  - File size and type restrictions handled client-side
*/

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload post images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'post-images');

-- Allow public read access to all images
CREATE POLICY "Public can view post images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'post-images');

-- Allow users to delete their own images (path starts with user_id)
CREATE POLICY "Users can delete own post images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own images
CREATE POLICY "Users can update own post images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'post-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'post-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );