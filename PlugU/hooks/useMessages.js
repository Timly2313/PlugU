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
  const [onlineParticipants, setOnlineParticipants] = useState([]);

  const oldestIdRef = useRef(null);
  const channelRef = useRef(null);

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

  // ── Realtime messages + presence ───────────────────────────────────────────
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    let mounted = true;

    const setup = async () => {
      // Track presence - mark user as online in this conversation
      const channel = supabase.channel(`conversation-${conversationId}`, {
        config: {
          presence: {
            key: currentUserId,
          },
        },
      });

      channel
        // ── Presence: track who's online ──────────────────────────────────
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const users = Object.values(state)
            .flat()
            .filter((p) => p.user_id !== currentUserId)
            .map((p) => p.user_id);
          if (mounted) setOnlineParticipants([...new Set(users)]);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          setOnlineParticipants((prev) => {
            const joined = newPresences
              .filter((p) => p.user_id !== currentUserId)
              .map((p) => p.user_id);
            return [...new Set([...prev, ...joined])];
          });
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          const left = leftPresences.map((p) => p.user_id);
          setOnlineParticipants((prev) => prev.filter((id) => !left.includes(id)));
        })
        
        // ── Realtime: new messages ────────────────────────────────────────
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        }, async (payload) => {
          const newMsg = payload.new;

          // Skip if it's our own message (handled optimistically)
          if (newMsg.sender_id === currentUserId) {
            // Replace optimistic placeholder with real message
            setMessages((prev) => {
              const filtered = prev.filter(
                (m) => !(m._optimistic && m.content === newMsg.content)
              );
              if (filtered.some((m) => m.id === newMsg.id)) return filtered;
              return [newMsg, ...filtered];
            });
            return;
          }

          // Another user's message - add with sender info
          const { data } = await supabase.rpc('get_conversation_messages', {
            p_conversation_id: conversationId,
            p_limit: 1,
            p_before_id: null,
          });
          
          if (data?.[0] && mounted) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data[0].id)) return prev;
              return [data[0], ...prev];
            });
          }
        })
        
        // ── Realtime: message status updates ────────────────────────────────
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        }, (payload) => {
          if (!mounted) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id ? { ...m, status: payload.new.status } : m
            )
          );
        })
        
        // ── Realtime: message deleted ─────────────────────────────────────
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        }, (payload) => {
          if (!mounted) return;
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        })
        
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: currentUserId,
              online_at: new Date().toISOString(),
            });
          }
        });

      channelRef.current = channel;
    };

    setup();

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
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

  // ── Delete message ─────────────────────────────────────────────────────────
  const deleteMessage = useCallback(async (messageId) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    
    try {
      await conversationService.deleteMessage(messageId);
    } catch (err) {
      console.error('[useMessages] delete error:', err);
      fetchMessages({ silent: true });
    }
  }, [fetchMessages]);

  return {
    messages,
    loadingInitial,
    loadingMore,
    hasMore,
    fetchError,
    sending,
    onlineParticipants,
    fetchMessages,
    loadMore,
    sendMessage,
    deleteMessage,
  };
}