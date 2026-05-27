import { supabase } from '../lib/supabase';

const PAGE_SIZE = 50;

export const conversationService = {

  getMessages: async (conversationId, beforeId = null) => {
    const { data, error } = await supabase.rpc('get_conversation_messages', {
      p_conversation_id: conversationId,
      p_limit:           PAGE_SIZE,
      p_before_id:       beforeId ?? null,
    });
    if (error) throw error;
    return data ?? [];
  },

  sendMessage: async (conversationId, content, extra = {}) => {
    const { data, error } = await supabase.functions.invoke('send_message', {
      body: {
        ...(conversationId ? { conversation_id: conversationId } : {}),
        content,
        ...extra,
      },
    });
    if (error) {
      const detail = await error.context?.json().catch(() => null);
      console.error('[conversationService] sendMessage error:', detail);
      throw error;
    }
    return data;
  },

  PAGE_SIZE,
};