import React, { useCallback } from 'react';
import {
  View, Text, FlatList, ActivityIndicator,
  RefreshControl, StyleSheet, Platform, Alert,StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../utilities/dimensions';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useConversations } from '../../hooks/useConversations';
import ConversationItem from '../../components/ConversationItem';
import SkeletonItem from '../../components/SkeletonItem';
import EmptyState from '../../components/EmptyState';
import { resolveDisplayName } from '../../utilities/messageUtils';

export default function MessagesScreen() {
  const router = useRouter();

  const {
    conversations,
    loading,
    refreshing,
    error,
    fetchConversations,
    markAsRead,
    deleteConversation,
    refresh,
  } = useConversations();

  const handleOpenConversation = useCallback((conv) => {
    if ((conv.unread_count ?? 0) > 0) markAsRead(conv.id);

    router.push({
      pathname: '/ConversationScreen',
      params: {
        conversationId: conv.id,
        displayName:    resolveDisplayName(conv),
        listingTitle:   conv.title ?? '',
        avatarUrl:      (conv.participant_avatars ?? [])[0] ?? '',
      },
    });
  }, [router, markAsRead]);

  const handleDelete = useCallback(async (conversationId) => {
    try {
      await deleteConversation(conversationId);
    } catch {
      Alert.alert('Error', 'Failed to delete conversation. Please try again.');
    }
  }, [deleteConversation]);

  const renderItem = useCallback(
    ({ item }) => (
      <ConversationItem 
        item={item} 
        onPress={handleOpenConversation}
        onDelete={handleDelete}
      />
    ),
    [handleOpenConversation, handleDelete]
  );

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return <EmptyState error={error} onRetry={fetchConversations} />;
  }, [loading, error, fetchConversations]);

  return (
    <ScreenWrapper bg="#fff">
      <StatusBar style="auto" />
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Messages</Text>
          {loading && !refreshing && (
            <ActivityIndicator size="small" color="#3F51B5" />
          )}
        </View>

        {loading && conversations.length === 0 && (
          <View>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonItem key={i} />
            ))}
          </View>
        )}

        {(!loading || conversations.length > 0) && (
          <FlatList
            data={conversations}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              conversations.length === 0 ? s.emptyContent : s.listContent
            }
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor="#3F51B5"
                colors={['#3F51B5']}
              />
            }
            removeClippedSubviews={Platform.OS === 'android'}
            maxToRenderPerBatch={12}
            windowSize={10}
            initialNumToRender={10}
            getItemLayout={(_, index) => ({
              length: hp(10), offset: hp(10) * index, index,
            })}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    paddingHorizontal: wp(4), paddingVertical: hp(1.5),
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle:  { fontSize: wp(5), fontWeight: 'bold', color: '#111827' },
  listContent:  { flexGrow: 1 },
  emptyContent: { flexGrow: 1 },
});