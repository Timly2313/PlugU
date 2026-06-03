import { useState, useEffect, useCallback, useRef } from 'react';
import { postDetailsService } from '../services/postDetailsService';

export function usePostComments(postId, userId) {
  const [comments,   setComments]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [sending,    setSending]    = useState(false);
  const [inputText,  setInputText]  = useState('');
  const cache = useRef({});

  const load = useCallback(async () => {
    if (!postId) return;
    if (cache.current[postId]) {
      setComments(cache.current[postId]);
      setLoading(false);
      return;
    }
    try {
      const data = await postDetailsService.getComments(postId, userId);
      cache.current[postId] = data;
      setComments(data);
    } catch (err) {
      console.error('[usePostComments] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [postId, userId]);

  useEffect(() => { load(); }, [load]);

  // ── Send — optimistic ──────────────────────────────────────────────────────
  const sendComment = useCallback(async (currentUser, onBumpCount) => {
    const text = inputText.trim();
    if (!text || sending) return;

    const optimistic = {
      id:         `opt_${Date.now()}`,
      content:    text,
      created_at: new Date().toISOString(),
      like_count: 0,
      is_liked:   false,
      user_id:    currentUser?.id,
      profiles: {
        username:     currentUser?.username,
        display_name: currentUser?.display_name,
        avatar_url:   currentUser?.avatar_url,
      },
    };

    const updated = [optimistic, ...comments];
    setComments(updated);
    cache.current[postId] = updated;
    setInputText('');
    onBumpCount?.();
    setSending(true);

    try {
      const result = await postDetailsService.sendComment(postId, text);
      const confirmed = updated.map((c) =>
        c.id === optimistic.id ? { ...optimistic, ...result.comment } : c
      );
      setComments(confirmed);
      cache.current[postId] = confirmed;
    } catch (err) {
      console.error('[usePostComments] send error:', err);
      const rolledBack = updated.filter((c) => c.id !== optimistic.id);
      setComments(rolledBack);
      cache.current[postId] = rolledBack;
    } finally {
      setSending(false);
    }
  }, [inputText, sending, comments, postId]);

  // ── Like comment — optimistic ──────────────────────────────────────────────
  const likeComment = useCallback(async (commentId) => {
    if (!userId) return;
    const current = comments.find((c) => c.id === commentId);
    if (!current) return;

    const wasLiked = current.is_liked;
    const newCount = wasLiked
      ? Math.max(0, current.like_count - 1)
      : current.like_count + 1;

    const optimistic = comments.map((c) =>
      c.id === commentId ? { ...c, is_liked: !wasLiked, like_count: newCount } : c
    );
    setComments(optimistic);
    cache.current[postId] = optimistic;

    try {
      const result = await postDetailsService.toggleCommentLike(commentId, userId);
      const confirmed = optimistic.map((c) =>
        c.id === commentId
          ? { ...c, is_liked: result.liked, like_count: result.like_count }
          : c
      );
      setComments(confirmed);
      cache.current[postId] = confirmed;
    } catch (err) {
      console.error('[usePostComments] like comment error:', err);
      const rolledBack = optimistic.map((c) =>
        c.id === commentId
          ? { ...c, is_liked: wasLiked, like_count: current.like_count }
          : c
      );
      setComments(rolledBack);
      cache.current[postId] = rolledBack;
    }
  }, [comments, postId, userId]);

  return {
    comments,
    loading,
    sending,
    inputText,
    setInputText,
    sendComment,
    likeComment,
  };
}