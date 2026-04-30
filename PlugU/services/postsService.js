import { supabase } from '../lib/supabase'; // adjust path to your supabase client

/**
 * Upload a single media file to Supabase Storage and return its public URL.
 * Files land in the `posts` bucket under  <userId>/<timestamp>-<random>.<ext>
 */
async function uploadMediaItem(userId, item) {
  const ext = item.uri.split('.').pop() ?? (item.type === 'image' ? 'jpg' : 'mp4');
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storagePath = `${userId}/${filename}`;

  const response = await fetch(item.uri);
  const blob = await response.blob();

  const mimeType = item.type === 'image'
    ? `image/${ext === 'jpg' ? 'jpeg' : ext}`
    : `video/${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('posts')                    // ← your storage bucket name
    .upload(storagePath, blob, { contentType: mimeType, upsert: false });

  if (uploadError) throw new Error(`Media upload failed: ${uploadError.message}`);

  const { data: urlData } = supabase.storage
    .from('posts')
    .getPublicUrl(storagePath);

  return {
    url: urlData.publicUrl,
    type: item.type,
    path: storagePath,
  };
}

/**
 * Resolve tag name strings to UUIDs from the `tags` table.
 * Tags that don't exist are created on-the-fly via upsert.
 */
async function resolveTagIds(tagNames) {
  if (tagNames.length === 0) return [];

  const { data, error } = await supabase
    .from('tags')                     // ← your tags table
    .upsert(
      tagNames.map((name) => ({ name: name.toLowerCase() })),
      { onConflict: 'name', ignoreDuplicates: false }
    )
    .select('id');

  if (error) throw new Error(`Tag resolution failed: ${error.message}`);
  return (data ?? []).map((row) => row.id);
}

/**
 * createPost
 *
 * 1. Uploads all media to Supabase Storage.
 * 2. Resolves tag names → tag UUIDs.
 * 3. Calls the `create-post` Edge Function with the assembled payload.
 *
 * Throws on any failure so the caller can surface the error to the user.
 *
 * @param {{ userId: string, content: string, media?: {uri: string, type: 'image'|'video'}[], tags?: string[], location?: string, latitude?: number, longitude?: number }} params
 */
export async function createPost({ userId, content, media = [], tags = [], location, latitude, longitude }) {
  // Step 1 — upload media
  let mediaUrls = [];
  if (media.length > 0) {
    mediaUrls = await Promise.all(
      media.map((item) => uploadMediaItem(userId, item))
    );
  }

  // Step 2 — resolve tags to UUIDs
  const tagIds = await resolveTagIds(tags);

  // Step 3 — call the Edge Function
  const { data, error } = await supabase.functions.invoke('create-post', {
    body: {
      content,
      media_urls: mediaUrls,   // [{ url, type, path }]
      tags: tagIds,             // [uuid, ...]
      location,
      latitude,
      longitude,
    },
  });

  if (error) throw new Error(error.message ?? 'Failed to create post');
  if (!data?.success) throw new Error(data?.error ?? 'Unknown error from create-post function');

  return data.post;
}