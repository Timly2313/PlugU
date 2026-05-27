import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { useConversations } from '../hooks/useConversations';
import { conversationService } from '../services/conversationService';

export function useStartConversation(currentUserId) {
  const [starting, setStarting] = useState(false);
  const { conversations, fetchConversations } = useConversations();

  const startOrOpenConversation = useCallback(async (recipientId, recipientName, avatarUrl) => {
    if (!currentUserId || starting) return;
    setStarting(true);

    try {
      await fetchConversations({ silent: true });

      // Check if a direct conversation already exists with this user
      const existing = conversations.find((conv) => {
        const usernames = conv.participant_usernames ?? [];
        const ids       = conv.participant_ids       ?? [];
        return ids.includes(recipientId) && usernames.length <= 2;
      });

      if (existing) {
        // Open existing conversation
        router.push({
          pathname: '/ConversationScreen',
          params: {
            conversationId: existing.id,
            displayName:    recipientName,
            avatarUrl:      avatarUrl ?? '',
          },
        });
        return;
      }

      // No existing conversation — send an empty init message to create one
      const result = await conversationService.sendMessage(null, 'Hi How are you?', {
        recipient_id: recipientId,
      });

      router.push({
        pathname: '/ConversationScreen',
        params: {
          conversationId: result.conversation_id,
          displayName:    recipientName,
          avatarUrl:      avatarUrl ?? '',
        },
      });
    } catch (err) {
      console.error('[useStartConversation] error:', err);
    } finally {
      setStarting(false);
    }
  }, [currentUserId, starting, conversations, fetchConversations]);

  return { startOrOpenConversation, starting };
}