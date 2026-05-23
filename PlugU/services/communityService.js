import { supabase } from '../lib/supabase';

const PAGE_LIMIT = 10;

async function callEdge(fnName, body) {
  const { data, error } = await supabase.functions.invoke(fnName, { body });
  if (error) throw error;
  return data;
}

export const communityService = {
  PAGE_LIMIT,

  getFeed: ({ page, limit = PAGE_LIMIT, userId }) =>
    supabase
      .from('posts')
      .select(
        `id, content, media_urls, location, status, like_count, comment_count, share_count,
         created_at, user_id,
         profiles:user_id (id, username, display_name, avatar_url),
         post_likes!left (user_id)`
      )
      .eq('status', 'active')
      .eq('post_likes.user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
      .then(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((p) => ({
          ...p,
          is_liked:   Array.isArray(p.post_likes) && p.post_likes.length > 0,
          post_likes: undefined,
        }));
      }),

  getPostForRealtime: (postId, userId) =>
    supabase
      .from('posts')
      .select(
        `id, content, media_urls, location, status, like_count, comment_count, share_count,
         created_at, user_id,
         profiles:user_id (id, username, display_name, avatar_url),
         post_likes!left (user_id)`
      )
      .eq('id', postId)
      .eq('post_likes.user_id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        return {
          ...data,
          is_liked:   Array.isArray(data.post_likes) && data.post_likes.length > 0,
          post_likes: undefined,
        };
      }),

  getComments: (postId, userId) =>
  supabase
    .rpc('get_post_comments', { p_post_id: postId, p_user_id: userId })
    .then(({ data, error }) => {
      if (error) throw error;
      return (data || []).map((r) => ({
        id:         r.id,
        content:    r.content,
        created_at: r.created_at,
        user_id:    r.user_id,
        parent_id:  r.parent_id,
        like_count: r.like_count ?? 0,
        is_liked:   r.is_liked ?? false,
        profiles: {
          username:     r.username,
          display_name: r.display_name,
          avatar_url:   r.avatar_url,
        },
      }));
    }),

toggleCommentLike: (commentId, userId) =>
  supabase
    .rpc('toggle_comment_like', {
      p_comment_id: commentId,
      p_user_id:    userId,
    })
    .then(({ data, error }) => {
      if (error) throw error;
      return data[0]; // { liked, like_count }
    }),

  likePost:    (postId, action) => callEdge('like_post',    { post_id: postId, action }),
  sendComment: (postId, content, parentId) =>
    callEdge('comment_post', { post_id: postId, content, parent_id: parentId }),
};