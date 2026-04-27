// PlugU - Messaging Module (React Native / Expo)
import { supabase } from './auth';

// Send a message
export async function sendMessage(conversationId, content, mediaUrls = [], replyToId = null, recipientId = null) {
  const { data, error } = await supabase.functions.invoke('send_message', {
    body: {
      conversation_id: conversationId,
      content,
      media_urls: mediaUrls,
      reply_to_id: replyToId,
      recipient_id: recipientId,
    },
  });

  if (error) throw error;
  return data;
}

// Get conversations
export async function getConversations() {
  const { data, error } = await supabase.functions.invoke('get_conversations');

  if (error) throw error;
  return data;
}

// Get conversation messages
export async function getConversationMessages(conversationId, limit = 50, beforeId = null) {
  const { data, error } = await supabase.rpc('get_conversation_messages', {
    p_conversation_id: conversationId,
    p_limit: limit,
    p_before_id: beforeId,
  });

  if (error) throw error;
  return data;
}

// Mark messages as read
export async function markConversationRead(conversationId) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;

  const { error } = await supabase
    .from('conversation_participants')
    .update({ unread_count: 0, last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);

  if (error) throw error;
}

// Subscribe to messages in a conversation
export function subscribeToMessages(conversationId, callback) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, callback)
    .subscribe();
}

// Subscribe to conversation updates
export function subscribeToConversations(callback) {
  return supabase
    .channel('public:conversations')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, callback)
    .subscribe();
}
