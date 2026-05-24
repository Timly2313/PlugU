import { supabase } from '../lib/supabase';

// Use supabase.functions.invoke instead of raw fetch —
// it automatically uses the correct project URL and attaches the auth token
export const messagesService = {

  getConversations: async () => {
    const { data, error } = await supabase.functions.invoke('get_conversations', {
      method: 'GET',
    });
    if (error) throw error;
    return data;
  },

  markAsRead: async (conversationId) => {
    const { data, error } = await supabase.functions.invoke('mark_read', {
      body: { conversation_id: conversationId },
    });
    if (error) throw error;
    return data;
  },
};