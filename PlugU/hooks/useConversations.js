import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { messagesService } from '../services/messagesService';

export function useConversations() {
  const [conversations, setConversations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [error,         setError]         = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchConversations = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setError(null);
      const json = await messagesService.getConversations();
      setConversations(json.conversations ?? []);
    } catch (err) {
      console.error('[useConversations] fetch error:', err);
      if (!silent) setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Mark as read — optimistic ──────────────────────────────────────────────
  const markAsRead = useCallback(async (conversationId) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      )
    );
    try {
      await messagesService.markAsRead(conversationId);
    } catch (err) {
      console.error('[useConversations] markAsRead error:', err);
    }
  }, []);

  // ── Initial load + realtime ────────────────────────────────────────────────
  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel('messages-screen-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchConversations({ silent: true })
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversation_participants' },
        () => fetchConversations({ silent: true })
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchConversations]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    refreshing,
    error,
    fetchConversations,
    markAsRead,
    refresh,
  };
}