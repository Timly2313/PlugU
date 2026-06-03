import { useState, useEffect, useCallback, useRef } from 'react';
import { postDetailsService } from '../services/postDetailsService';

export function usePostDetails(postId, userId) {
  const [post,    setPost]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!postId) return;
    try {
      setError(null);
      const data = await postDetailsService.getPost(postId, userId);
      setPost(data);
    } catch (err) {
      console.error('[usePostDetails] load error:', err);
      setError(err.message ?? 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId, userId]);

  useEffect(() => { load(); }, [load]);

  // ── Like — optimistic ──────────────────────────────────────────────────────
  const toggleLike = useCallback(async () => {
    if (!post) return;
    const wasLiked = post.is_liked;
    setPost((prev) => ({
      ...prev,
      is_liked:   !wasLiked,
      like_count: wasLiked ? prev.like_count - 1 : prev.like_count + 1,
    }));
    try {
      await postDetailsService.likePost(postId, wasLiked ? 'unlike' : 'like');
    } catch (err) {
      console.error('[usePostDetails] like error:', err);
      setPost((prev) => ({
        ...prev,
        is_liked:   wasLiked,
        like_count: wasLiked ? prev.like_count + 1 : prev.like_count - 1,
      }));
    }
  }, [post, postId]);

  return { post, setPost, loading, error, reload: load, toggleLike };
}