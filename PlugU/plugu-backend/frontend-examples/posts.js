// PlugU - Posts Module (React Native / Expo)
import { supabase } from './auth';

// Create a post
export async function createPost(content, mediaUrls = [], location = null, tags = []) {
  const { data, error } = await supabase.functions.invoke('create_post', {
    body: { content, media_urls: mediaUrls, location, tags },
  });

  if (error) throw error;
  return data;
}

// Fetch feed
export async function fetchFeed(limit = 20, offset = 0) {
  const { data, error } = await supabase.rpc('get_feed', {
    p_limit: limit,
    p_offset: offset,
    p_user_id: (await supabase.auth.getUser()).data.user?.id,
  });

  if (error) throw error;
  return data;
}

// Like/unlike a post
export async function likePost(postId, action = 'like') {
  const { data, error } = await supabase.functions.invoke('like_post', {
    body: { post_id: postId, action },
  });

  if (error) throw error;
  return data;
}

// Comment on a post
export async function commentOnPost(postId, content, parentId = null) {
  const { data, error } = await supabase.functions.invoke('comment_post', {
    body: { post_id: postId, content, parent_id: parentId },
  });

  if (error) throw error;
  return data;
}

// Get post comments
export async function getPostComments(postId, limit = 50, offset = 0) {
  const { data, error } = await supabase.rpc('get_post_comments', {
    p_post_id: postId,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;
  return data;
}

// Subscribe to new posts
export function subscribeToPosts(callback) {
  return supabase
    .channel('public:posts')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, callback)
    .subscribe();
}

// Subscribe to post likes
export function subscribeToPostLikes(postId, callback) {
  return supabase
    .channel(`post_likes:${postId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes', filter: `post_id=eq.${postId}` }, callback)
    .subscribe();
}
