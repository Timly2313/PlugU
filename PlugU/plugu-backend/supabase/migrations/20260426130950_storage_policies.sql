-- PlugU Storage Policies
-- Run this in Supabase SQL Editor after creating buckets

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

-- Create buckets (run via Supabase Dashboard or API)
-- Buckets needed: avatars, post-media, listing-images

-- =============================================================================
-- AVATARS BUCKET POLICIES
-- =============================================================================

-- Allow anyone to view avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================================================
-- POST-MEDIA BUCKET POLICIES
-- =============================================================================

-- Allow anyone to view post media
CREATE POLICY "Post media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

-- Allow authenticated users to upload post media
CREATE POLICY "Users can upload post media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own post media
CREATE POLICY "Users can update their own post media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own post media
CREATE POLICY "Users can delete their own post media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================================================
-- LISTING-IMAGES BUCKET POLICIES
-- =============================================================================

-- Allow anyone to view listing images
CREATE POLICY "Listing images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

-- Allow authenticated users to upload listing images
CREATE POLICY "Users can upload listing images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own listing images
CREATE POLICY "Users can update their own listing images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'listing-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own listing images
CREATE POLICY "Users can delete their own listing images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listing-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================================================
-- FILE SIZE AND TYPE RESTRICTIONS (via triggers or application logic)
-- =============================================================================

-- Recommended file structure:
-- avatars/{user_id}/{timestamp}-{filename}.jpg
-- post-media/{user_id}/{post_id}/{timestamp}-{filename}.jpg
-- listing-images/{user_id}/{listing_id}/{timestamp}-{filename}.jpg
