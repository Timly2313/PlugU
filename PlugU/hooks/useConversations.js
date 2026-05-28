import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { messagesService } from '../services/messagesService';

export function useConversations() {
  const [conversations, setConversations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [error,         setError]         = useState(null);
  
  const channelRef = useRef(null);

  const fetchConversations = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setError(null);
      const data = await messagesService.getConversations();
      setConversations(data.conversations ?? []);
    } catch (err) {
      console.error('[useConversations] fetch error:', err);
      if (!silent) setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const markAsRead = useCallback(async (conversationId) => {
    setConversations((prev) =>
      prev.map((c) => c.id === conversationId ? { ...c, unread_count: 0 } : c)
    );
    try {
      await messagesService.markAsRead(conversationId);
    } catch (err) {
      console.error('[useConversations] markAsRead error:', err);
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    try {
      await messagesService.deleteConversation(conversationId);
    } catch (err) {
      console.error('[useConversations] delete error:', err);
      fetchConversations({ silent: true });
      throw err;
    }
  }, [fetchConversations]);

  // ── Real-time ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      await fetchConversations();
      if (!mounted) return;

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel(`conversations-${user.id}`)
        
        // New messages from others
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=neq.${user.id}`
        }, (payload) => {
          const { conversation_id, content, created_at } = payload.new;
          
          setConversations((prev) => {
            const exists = prev.some((c) => c.id === conversation_id);
            if (!exists) {
              fetchConversations({ silent: true });
              return prev;
            }
            
            const updated = prev.map((c) => 
              c.id === conversation_id
                ? {
                    ...c,
                    last_message_content: content,
                    last_message_at: created_at,
                    unread_count: (c.unread_count ?? 0) + 1,
                  }
                : c
            );
            
            return [...updated].sort((a, b) => 
              new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)
            );
          });
        })
        
        // Conversation metadata updates (trigger from messages)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        }, (payload) => {
          setConversations((prev) => {
            const updated = prev.map((c) => 
              c.id === payload.new.id ? { ...c, ...payload.new } : c
            );
            return [...updated].sort((a, b) => 
              new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)
            );
          });
        })
        
        // Unread count changes / mark as read
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          setConversations((prev) => 
            prev.map((c) => 
              c.id === payload.new.conversation_id
                ? { ...c, unread_count: payload.new.unread_count ?? 0 }
                : c
            )
          );
        })
        
        // User removed from conversation (delete)
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          setConversations((prev) => 
            prev.filter((c) => c.id !== payload.old.conversation_id)
          );
        })
        
        .subscribe();

      channelRef.current = channel;
    };

    setup();

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
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
    deleteConversation,
    refresh,
  };
}