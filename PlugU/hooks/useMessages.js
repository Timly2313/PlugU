import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { conversationService } from '../services/conversationService';

function makeOptimistic(content, senderId) {
  return {
    id:                `optimistic-${Date.now()}`,
    conversation_id:   null,
    sender_id:         senderId,
    content,
    media_urls:        [],
    reply_to_id:       null,
    status:            'sending',
    created_at:        new Date().toISOString(),
    sender_username:   'Me',
    sender_avatar_url: null,
    _optimistic:       true,
  };
}

export function useMessages(conversationId, currentUserId) {
  const [messages,       setMessages]       = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [hasMore,        setHasMore]        = useState(true);
  const [fetchError,     setFetchError]     = useState(null);
  const [sending,        setSending]        = useState(false);

  const oldestIdRef = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async ({ beforeId = null, append = false } = {}) => {
    if (!conversationId) return;
    try {
      const rows = await conversationService.getMessages(conversationId, beforeId);

      if (append) {
        setMessages((prev) => {
          const existing = new Set(prev.map((m) => m.id));
          return [...prev, ...rows.filter((r) => !existing.has(r.id))];
        });
      } else {
        setMessages(rows);
      }

      setHasMore(rows.length === conversationService.PAGE_SIZE);
      if (rows.length > 0) oldestIdRef.current = rows[rows.length - 1].id;
      setFetchError(null);
    } catch (err) {
      console.error('[useMessages] fetch error:', err);
      setFetchError(err.message ?? 'Failed to load messages');
    } finally {
      setLoadingInitial(false);
      setLoadingMore(false);
    }
  }, [conversationId]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ── Realtime ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        const newMsg = payload.new;

        if (newMsg.sender_id === currentUserId) {
          // Replace optimistic placeholder
          const { data } = await supabase.rpc('get_conversation_messages', {
            p_conversation_id: conversationId,
            p_limit:           1,
            p_before_id:       null,
          });
          if (data?.[0]) {
            setMessages((prev) => {
              const filtered = prev.filter(
                (m) => !(m._optimistic && m.content === newMsg.content)
              );
              return prev.some((m) => m.id === data[0].id)
                ? filtered
                : [data[0], ...filtered];
            });
          }
          return;
        }

        // Another user's message
        const { data } = await supabase.rpc('get_conversation_messages', {
          p_conversation_id: conversationId,
          p_limit:           1,
          p_before_id:       null,
        });
        if (data?.[0]?.id === newMsg.id) {
          setMessages((prev) =>
            prev.some((m) => m.id === data[0].id) ? prev : [data[0], ...prev]
          );
        }
      })
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.new.id ? { ...m, status: payload.new.status } : m
          )
        );
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversationId, currentUserId]);

  // ── Load more ──────────────────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || !oldestIdRef.current) return;
    setLoadingMore(true);
    fetchMessages({ beforeId: oldestIdRef.current, append: true });
  }, [loadingMore, hasMore, fetchMessages]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || sending) return;
    setSending(true);

    const optimistic = makeOptimistic(content, currentUserId);
    setMessages((prev) => [optimistic, ...prev]);

    try {
      const result = await conversationService.sendMessage(conversationId, content);

      if (result?.message_id) {
        setMessages((prev) =>
          prev.map((m) =>
            m._optimistic && m.content === content
              ? { ...m, id: result.message_id, _optimistic: false, status: 'sent' }
              : m
          )
        );
      }
    } catch (err) {
      console.error('[useMessages] send error:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m._optimistic && m.content === content
            ? { ...m, status: 'failed' }
            : m
        )
      );
    } finally {
      setSending(false);
    }
  }, [sending, conversationId, currentUserId]);

  return {
    messages,
    loadingInitial,
    loadingMore,
    hasMore,
    fetchError,
    sending,
    fetchMessages,
    loadMore,
    sendMessage,
  };
}