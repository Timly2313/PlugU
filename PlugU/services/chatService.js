import { supabase } from "../lib/supabase";
import {formatTimestamp} from '../utilities/timestamps'



export const getOrCreateConversation = async (currentUserId, otherUserId) => {
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .or(
      `and(user1_id.eq.${currentUserId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUserId})`
    )
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("conversations")
    .insert([{ user1_id: currentUserId, user2_id: otherUserId }])
    .select()
    .single();

  if (error) throw error;
  return data;
};


export const fetchUserConversations = async (userId) => {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      user1_id,
      user2_id,
      created_at,
      user1:users!user1_id(id, full_name, profile_image),
      user2:users!user2_id(id, full_name, profile_image),
      messages(id, content, created_at, sender_id)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((conv) => {
    const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1;
    const messages = conv.messages || [];
    
   
    const sortedMessages = messages.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    const lastMessage = sortedMessages[0];


    const unreadCount = messages.filter(msg => 
      msg.sender_id !== userId
    ).length;

    return {
      id: conv.id,
      otherUserId: otherUser.id, 
      userName: otherUser.full_name || "Unknown User",
      userAvatar: otherUser.profile_image || "https://via.placeholder.com/150",
      lastMessage: lastMessage?.content || "No messages yet",
      lastMessageTime: lastMessage?.created_at ? formatTimestamp(lastMessage.created_at) : formatTimestamp(conv.created_at),
      unreadCount: unreadCount,
      currentUserId: userId
    };
  });
};


export const fetchMessages = async (conversationId) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:users(full_name, profile_image)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
};


export const sendMessage = async (conversationId, senderId, content) => {
  const { error } = await supabase
    .from("messages")
    .insert([{ conversation_id: conversationId, sender_id: senderId, content }]);

  if (error) throw error;
};


export const subscribeToMessages = (conversationId, onNewMessage) => {
  const channel = supabase
    .channel(`conversation-${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onNewMessage(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const deleteMessage = async (messageId) => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) throw error;
};
