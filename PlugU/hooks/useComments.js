import { useState, useCallback, useRef } from 'react';
import { communityService } from '../services/communityService';

export function useComments(currentUser, setPosts) {
  const [activePostId,     setActivePostId]     = useState(null);  
  const [comments,         setComments]         = useState([]);
  const [isLoadingComments,setIsLoadingComments]= useState(false);
  const [commentText,      setCommentText]      = useState('');

  // Session-level cache: postId → comment[]
  const cache = useRef({});

  const openComments = useCallback(async (postId) => {
    setActivePostId(postId);
    setCommentText('');

    // Serve from cache if available
    if (cache.current[postId]) {
      setComments(cache.current[postId]);
      return;
    }

    setIsLoadingComments(true);
    setComments([]);
    try {
      const data = await communityService.getComments(postId);
      cache.current[postId] = data;
      setComments(data);
    } catch (err) {
      console.error('Load comments error:', err);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  const closeComments = useCallback(() => {
    setActivePostId(null);
    setComments([]);
    setCommentText('');
  }, []);

  const sendComment = useCallback(async () => {
    const text = commentText.trim();
    if (!text || !activePostId) return;

    const optimistic = {
      id: `opt_${Date.now()}`,
      content: text,
      created_at: new Date().toISOString(),
      like_count: 0,
      user_id: currentUser?.id,
      profiles: {
        id:           currentUser?.id,
        username:     currentUser?.username,
        display_name: currentUser?.display_name,
        avatar_url:   currentUser?.avatar_url,
      },
    };

    // Prepend optimistic (newest first)
    const updated = [optimistic, ...comments];
    setComments(updated);
    cache.current[activePostId] = updated;

    // Bump count in feed
    setPosts((prev) =>
      prev.map((p) =>
        p.id === activePostId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p
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

  return {
    activePostId,
    comments,
    isLoadingComments,
    commentText,
    setCommentText,
    openComments,
    closeComments,
    sendComment,
  };
}