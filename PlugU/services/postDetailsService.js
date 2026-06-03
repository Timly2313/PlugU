import { supabase } from '../lib/supabase';

export const postDetailsService = {

  getPost: async (postId, userId = null) => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, content, media_urls, location, status,
        like_count, comment_count, share_count, created_at, user_id,
        profiles:user_id (id, username, display_name, avatar_url),
        post_likes!left (user_id)
      `)
      .eq('id', postId)
      .eq('post_likes.user_id', userId)
      .single();

    if (error) throw error;

    return {
      ...data,
      is_liked:   Array.isArray(data.post_likes) && data.post_likes.length > 0,
      post_likes: undefined,
    };
  },

  getComments: async (postId, userId = null) =>
    supabase
      .rpc('get_post_comments', { p_post_id: postId, p_user_id: userId })
      .then(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((r) => ({
          id:         r.id,
          content:    r.content,
          created_at: r.created_at,
          user_id:    r.user_id,
          parent_id:  r.parent_id,
          like_count: r.like_count ?? 0,
          is_liked:   r.is_liked   ?? false,
          profiles: {
            username:     r.username,
            display_name: r.display_name,
            avatar_url:   r.avatar_url,
          },
        }));
      }),

  likePost: (postId, action) =>
    supabase.functions.invoke('like_post', { body: { post_id: postId, action } })
      .then(({ data, error }) => { if (error) throw error; return data; }),

  sendComment: (postId, content) =>
    supabase.functions.invoke('comment_post', { body: { post_id: postId, content } })
      .then(({ data, error }) => { if (error) throw error; return data; }),

  toggleCommentLike: (commentId, userId) =>
    supabase
      .rpc('toggle_comment_like', { p_comment_id: commentId, p_user_id: userId })
      .then(({ data, error }) => {
        if (error) throw error;
        return data[0];
      }),
};