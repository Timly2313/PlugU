import { supabase } from '../lib/supabase';

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

  // Delete via Edge Function (recommended — handles RLS + cleanup in one place)
// conversationService.js — change to use edge function
deleteMessage: async (messageId) => {
  const { data, error } = await supabase.functions.invoke('delete_message', {
    body: { message_id: messageId },
  });
  if (error) throw error;
  return data;
},

  // Or direct client-side delete (faster, no network round-trip to edge function)
  leaveConversation: async (conversationId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    if (error) throw error;
  },
};