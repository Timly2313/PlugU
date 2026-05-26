import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, FlatList, ActivityIndicator,
  TouchableOpacity, Text, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper         from '../components/ScreenWrapper';
import { useAuth }           from '../context/authContext';
import { useMessages }       from '../hooks/useMessages';
import ConversationHeader    from '../components/ConversationHeader';
import MessageBubble         from '../components/MessageBubble';
import DateDivider           from '../components/DateDivider';
import MessageInput          from '../components/MessageInput';
import EmptyMessages         from '../components/EmptyMessages';

export default function ConversationScreen() {
  const router  = useRouter();
  const params  = useLocalSearchParams();
  const { profile } = useAuth();

  const conversationId = params.conversationId;
  const displayName    = params.displayName  ?? 'Conversation';
  const listingTitle   = params.listingTitle ?? '';
  const avatarUrl      = params.avatarUrl    ?? '';

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  const {
    messages,
    loadingInitial,
    loadingMore,
    fetchError,
    sending,
    fetchMessages,
    loadMore,
    sendMessage,
  } = useMessages(conversationId, profile?.id);

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    await sendMessage(text);
  }, [inputText, sendMessage]);

  // ── Render item ────────────────────────────────────────────────────────────
  const renderItem = useCallback(({ item, index }) => {
    if (item.type === 'divider') return <DateDivider date={item.date} />;

    const isMe      = item.sender_id === profile?.id;
    const nextItem  = messages[index + 1];
    const showAvatar = !nextItem || nextItem.sender_id !== item.sender_id;

    return (
      <MessageBubble
        item={item}
        isMe={isMe}
        showAvatar={showAvatar}
      />
    );
  }, [messages, profile?.id]);

  const keyExtractor = useCallback((item) => item.id, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadingInitial) {
    return (
      <ScreenWrapper bg="#F9FAFB">
        <ConversationHeader
          displayName={displayName}
          listingTitle={listingTitle}
          avatarUrl={avatarUrl}
          onBack={() => router.back()}
        />
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#3F51B5" />
        </View>
      </ScreenWrapper>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <ScreenWrapper bg="#F9FAFB">
        <ConversationHeader
          displayName={displayName}
          listingTitle={listingTitle}
          avatarUrl={avatarUrl}
          onBack={() => router.back()}
        />
        <View style={s.centered}>
          <AlertCircle size={wp(12)} color="#EF4444" />
          <Text style={s.errorText}>{fetchError}</Text>
          <TouchableOpacity
            style={s.retryBtn}
            onPress={() => fetchMessages()}
          >
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <ScreenWrapper bg="#F9FAFB">
      <StatusBar style="dark" />

      <ConversationHeader
        displayName={displayName}
        listingTitle={listingTitle}
        avatarUrl={avatarUrl}
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          inverted
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore
              ? <View style={s.loadMore}><ActivityIndicator size="small" color="#3F51B5" /></View>
              : null
          }
          ListEmptyComponent={<EmptyMessages />}
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={20}
          windowSize={10}
        />

        <MessageInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          sending={sending}
        />
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  flex:        { flex: 1 },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: hp(2) },
  listContent: { paddingVertical: hp(1.5) },
  loadMore:    { alignItems: 'center', paddingVertical: hp(1.5) },
  errorText:   { fontSize: wp(3.8), color: '#374151', textAlign: 'center', paddingHorizontal: wp(8) },
  retryBtn:    { backgroundColor: '#3F51B5', paddingHorizontal: wp(6), paddingVertical: hp(1.2), borderRadius: wp(2) },
  retryText:   { color: '#fff', fontWeight: '600', fontSize: wp(3.5) },
});