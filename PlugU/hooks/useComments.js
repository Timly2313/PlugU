import { useState, useCallback, useRef } from 'react';
import { communityService } from '../services/communityService';

export function useComments(currentUser, setPosts) {
  const [activePostId,      setActivePostId]      = useState(null);
  const [comments,          setComments]          = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText,       setCommentText]       = useState('');

  const cache = useRef({});

  // ── Open ────────────────────────────────────────────────────────────────────
  const openComments = useCallback(async (postId) => {
    setActivePostId(postId);
    setCommentText('');

    if (cache.current[postId]) {
      setComments(cache.current[postId]);
      return;
    }

    setIsLoadingComments(true);
    setComments([]);
    try {
      const data = await communityService.getComments(postId, currentUser?.id);
      cache.current[postId] = data;
      setComments(data);
    } catch (err) {
      console.error('Load comments error:', err);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  }, [currentUser?.id]);

  // ── Close — clears everything so modal unmounts cleanly ────────────────────
  const closeComments = useCallback(() => {
    setActivePostId(null);
    setComments([]);
    setCommentText('');
  }, []);

  // ── Send comment ────────────────────────────────────────────────────────────
  const sendComment = useCallback(async () => {
    const text = commentText.trim();
    if (!text || !activePostId) return;

    const optimistic = {
      id:         `opt_${Date.now()}`,
      content:    text,
      created_at: new Date().toISOString(),
      like_count: 0,
      is_liked:   false,
      user_id:    currentUser?.id,
      profiles: {
        id:           currentUser?.id,
        username:     currentUser?.username,
        display_name: currentUser?.display_name,
        avatar_url:   currentUser?.avatar_url,
      },
    };

    const updated = [optimistic, ...comments];
    setComments(updated);
    cache.current[activePostId] = updated;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === activePostId
          ? { ...p, comment_count: (p.comment_count || 0) + 1 }
          : p
      )
    );
    setCommentText('');

    try {
      const result = await communityService.sendComment(activePostId, text);
      const confirmed = updated.map((c) =>
        c.id === optimistic.id ? { ...optimistic, ...result.comment } : c
      );
      setComments(confirmed);
      cache.current[activePostId] = confirmed;
    } catch (err) {
      console.error('Comment error:', err);
      const rolledBack = updated.filter((c) => c.id !== optimistic.id);
      setComments(rolledBack);
      cache.current[activePostId] = rolledBack;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === activePostId
            ? { ...p, comment_count: Math.max(0, (p.comment_count || 1) - 1) }
            : p
        )
      );
    }
  }, [commentText, activePostId, comments, currentUser, setPosts]);

  // ── Like comment — optimistic ───────────────────────────────────────────────
  const likeComment = useCallback(async (commentId) => {
    if (!activePostId || !currentUser?.id) return;

    // Find current state
    const current = comments.find((c) => c.id === commentId);
    if (!current) return;

    const wasLiked  = current.is_liked;
    const newLiked  = !wasLiked;
    const newCount  = wasLiked
      ? Math.max(0, current.like_count - 1)
      : current.like_count + 1;

    // Apply optimistically
    const optimistic = comments.map((c) =>
      c.id === commentId
        ? { ...c, is_liked: newLiked, like_count: newCount }
        : c
    );
    setComments(optimistic);
    cache.current[activePostId] = optimistic;

    try {
      const result = await communityService.toggleCommentLike(
        commentId,
        currentUser.id
      );
      // Reconcile with server count (in case of race conditions)
      const confirmed = optimistic.map((c) =>
        c.id === commentId
          ? { ...c, is_liked: result.liked, like_count: result.like_count }
          : c
      );
      setComments(confirmed);
      cache.current[activePostId] = confirmed;
    } catch (err) {
      console.error('Like comment error:', err);
      // Roll back
      const rolledBack = optimistic.map((c) =>
        c.id === commentId
          ? { ...c, is_liked: wasLiked, like_count: current.like_count }
          : c
      );
      setComments(rolledBack);
      cache.current[activePostId] = rolledBack;
    }
  }, [comments, activePostId, currentUser?.id]);

  return {
    activePostId,
    comments,
    isLoadingComments,
    commentText,
    setCommentText,
    openComments,
    closeComments,
    sendComment,
    likeComment,
  };
}