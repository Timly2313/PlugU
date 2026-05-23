import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { communityService } from '../services/communityService';

const { PAGE_LIMIT } = communityService;

export function useFeed(userId) {
  const [posts,        setPosts]        = useState([]);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(true);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingMore,  setLoadingMore]  = useState(false);

  const fetchPosts = useCallback(async (pageNumber = 1, refresh = false) => {
    try {
      if (refresh)               setIsRefreshing(true);
      else if (pageNumber === 1) setIsLoading(true);
      else                       setLoadingMore(true);

      const data = await communityService.getFeed({
        page: pageNumber,
        limit: PAGE_LIMIT,
        userId,
      });

      if (refresh || pageNumber === 1) {
        setPosts(data);
      } else {
        setPosts((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          return [...prev, ...data.filter((p) => !ids.has(p.id))];
        });
      }

      setHasMore(data.length === PAGE_LIMIT);
      setPage(pageNumber);
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setLoadingMore(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => { fetchPosts(1); }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('community-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          try {
            const data = await communityService.getPostForRealtime(payload.new.id, userId);
            setPosts((prev) => [data, ...prev]);
          } catch { /* silent */ }
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts((prev) =>
            prev.map((p) => p.id === payload.new.id ? { ...p, ...payload.new } : p)
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  // Like — optimistic
  const handleLike = useCallback(async (postId, isLiked) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, is_liked: !isLiked, like_count: isLiked ? p.like_count - 1 : p.like_count + 1 }
          : p
      )
    );
    try {
      await communityService.likePost(postId, isLiked ? 'unlike' : 'like');
    } catch (err) {
      console.error('Like error:', err);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, is_liked: isLiked, like_count: isLiked ? p.like_count + 1 : p.like_count - 1 }
            : p
        )
      );
    }
  }, []);

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore) fetchPosts(page + 1);
  }, [hasMore, loadingMore, page, fetchPosts]);

  const refresh = useCallback(() => fetchPosts(1, true), [fetchPosts]);

  return {
    posts, setPosts,
    isLoading, isRefreshing, loadingMore,
    handleLike, loadMore, refresh,
  };
}