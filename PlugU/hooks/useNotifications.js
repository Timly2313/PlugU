import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { notificationsService } from '../services/notificationsService';

export function useNotifications() {
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount,   setUnreadCount]     = useState(0);
  const [loading,       setLoading]         = useState(true);
  const [loadingMore,   setLoadingMore]     = useState(false);
  const [refreshing,    setRefreshing]      = useState(false);
  const [hasMore,       setHasMore]         = useState(true);
  const [error,         setError]           = useState(null);
  const [unreadOnly,    setUnreadOnly]      = useState(false);

  const pageRef = useRef(1);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async ({
    page     = 1,
    append   = false,
    silent   = false,
    unread   = false,
  } = {}) => {
    try {
      if (!silent) setError(null);

      const data = await notificationsService.getNotifications({
        page, unreadOnly: unread,
      });

      if (append) {
        setNotifications((prev) => {
          const ids = new Set(prev.map((n) => n.id));
          return [...prev, ...data.filter((n) => !ids.has(n.id))];
        });
      } else {
        setNotifications(data);
      }

      setHasMore(data.length === notificationsService.PAGE_SIZE);
      pageRef.current = page;
    } catch (err) {
      console.error('[useNotifications] fetch error:', err);
      if (!silent) setError(err.message ?? 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('[useNotifications] unread count error:', err);
    }
  }, []);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications({ page: 1, unread: unreadOnly });
    fetchUnreadCount();
  }, [unreadOnly]);

  // ── Realtime ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'notifications',
      }, async (payload) => {
        // Fetch full row with actor join
        const { data } = await supabase
          .from('notifications')
          .select(`
            id, type, title, body, data,
            is_read, read_at, created_at,
            target_type, target_id,
            actor:actor_id (id, username, display_name, avatar_url)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          setNotifications((prev) =>
            prev.some((n) => n.id === data.id) ? prev : [data, ...prev]
          );
          setUnreadCount((c) => c + 1);
        }
      })
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'notifications',
      }, (payload) => {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === payload.new.id
              ? { ...n, is_read: payload.new.is_read, read_at: payload.new.read_at }
              : n
          )
        );
        // Recount on update
        fetchUnreadCount();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchUnreadCount]);

  // ── Load more ──────────────────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchNotifications({
      page:   pageRef.current + 1,
      append: true,
      silent: true,
      unread: unreadOnly,
    });
  }, [loadingMore, hasMore, fetchNotifications, unreadOnly]);

  // ── Refresh ────────────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications({ page: 1, unread: unreadOnly });
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount, unreadOnly]);

  // ── Mark single as read — optimistic ──────────────────────────────────────
  const markAsRead = useCallback(async (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      )
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await notificationsService.markAsRead([notificationId]);
    } catch (err) {
      console.error('[useNotifications] markAsRead error:', err);
      // Revert
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: false, read_at: null } : n
        )
      );
      setUnreadCount((c) => c + 1);
    }
  }, []);

  // ── Mark all as read — optimistic ──────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: now }))
    );
    setUnreadCount(0);

    try {
      await notificationsService.markAllAsRead();
    } catch (err) {
      console.error('[useNotifications] markAllAsRead error:', err);
      refresh();
    }
  }, [refresh]);

  // ── Toggle filter ──────────────────────────────────────────────────────────
  const toggleUnreadFilter = useCallback(() => {
    setUnreadOnly((prev) => !prev);
    setLoading(true);
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    unreadOnly,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    toggleUnreadFilter,
  };
}