import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import { StatusBar } from 'expo-status-bar';
import ScreenWrapper from '../components/ScreenWrapper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/authContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const SEND_MESSAGE_URL =
  'https://ijfvlpcmizlerdtzqkul.supabase.co/functions/v1/send_message';
const PAGE_SIZE = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMessageTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateDivider(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.slice(0, 2) || '??').toUpperCase();
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
    apikey: session.access_token,
  };
}

// ─── Inject date-dividers between messages ────────────────────────────────────
// Messages arrive newest-first from the RPC; we reverse for display (oldest first).
// A divider is inserted whenever the calendar date changes.

function injectDividers(messages) {
  const result = [];
  let lastDate = null;

  for (const msg of messages) {
    const dateStr = new Date(msg.created_at).toDateString();
    if (dateStr !== lastDate) {
      result.push({ type: 'divider', id: `divider-${msg.created_at}`, date: msg.created_at });
      lastDate = dateStr;
    }
    result.push({ type: 'message', ...msg });
  }
  return result;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DateDivider({ date }) {
  return (
    <View style={divStyles.row}>
      <View style={divStyles.line} />
      <Text style={divStyles.label}>{formatDateDivider(date)}</Text>
      <View style={divStyles.line} />
    </View>
  );
}

const divStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: hp(1.5), paddingHorizontal: wp(4) },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB' },
  label: { fontSize: wp(2.8), color: '#9CA3AF', marginHorizontal: wp(3), fontWeight: '500' },
});

function MessageBubble({ item, isMe, showAvatar, senderInitials, senderAvatar }) {
  const isMe_ = isMe;

  return (
    <View style={[bubStyles.wrapper, isMe_ ? bubStyles.wrapperMe : bubStyles.wrapperThem]}>
      {/* Other person's avatar — shown on first message in a group */}
      {!isMe_ && (
        <View style={bubStyles.avatarSlot}>
          {showAvatar ? (
            senderAvatar ? (
              <Image source={{ uri: senderAvatar }} style={bubStyles.avatar} />
            ) : (
              <View style={bubStyles.avatarFallback}>
                <Text style={bubStyles.avatarText}>{senderInitials}</Text>
              </View>
            )
          ) : (
            <View style={bubStyles.avatarSpacer} />
          )}
        </View>
      )}

      <View style={[bubStyles.bubble, isMe_ ? bubStyles.bubbleMe : bubStyles.bubbleThem]}>
        <Text style={[bubStyles.text, isMe_ ? bubStyles.textMe : bubStyles.textThem]}>
          {item.content}
        </Text>
        <View style={bubStyles.meta}>
          <Text style={[bubStyles.time, isMe_ ? bubStyles.timeMe : bubStyles.timeThem]}>
            {formatMessageTime(item.created_at)}
          </Text>
          {/* Delivery status for own messages */}
          {isMe_ && (
            <Text style={bubStyles.status}>
              {item.status === 'read' ? '✓✓' : item.status === 'delivered' ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const bubStyles = StyleSheet.create({
  wrapper: { flexDirection: 'row', marginBottom: hp(0.6), paddingHorizontal: wp(4) },
  wrapperMe: { justifyContent: 'flex-end' },
  wrapperThem: { justifyContent: 'flex-start' },
  avatarSlot: { width: wp(8), marginRight: wp(2), justifyContent: 'flex-end' },
  avatar: { width: wp(7), height: wp(7), borderRadius: wp(3.5) },
  avatarFallback: {
    width: wp(7), height: wp(7), borderRadius: wp(3.5),
    backgroundColor: '#3F51B5', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: 'white', fontSize: wp(2.5), fontWeight: '600' },
  avatarSpacer: { width: wp(7) },
  bubble: {
    maxWidth: '75%',
    borderRadius: wp(5),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.1),
  },
  bubbleMe: {
    backgroundColor: '#3F51B5',
    borderBottomRightRadius: wp(1.5),
  },
  bubbleThem: {
    backgroundColor: 'white',
    borderBottomLeftRadius: wp(1.5),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  text: { fontSize: wp(3.8), lineHeight: hp(2.6) },
  textMe: { color: 'white' },
  textThem: { color: '#111827' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: wp(1), marginTop: hp(0.4), justifyContent: 'flex-end' },
  time: { fontSize: wp(2.3) },
  timeMe: { color: 'rgba(255,255,255,0.65)' },
  timeThem: { color: '#9CA3AF' },
  status: { fontSize: wp(2.3), color: 'rgba(255,255,255,0.65)' },
});

// ─── Optimistic message factory ───────────────────────────────────────────────

function makeOptimistic(content, senderId) {
  return {
    id: `optimistic-${Date.now()}`,
    conversation_id: null,
    sender_id: senderId,
    content,
    media_urls: [],
    reply_to_id: null,
    status: 'sending',
    created_at: new Date().toISOString(),
    sender_username: 'Me',
    sender_avatar_url: null,
    _optimistic: true,
  };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profile } = useAuth();

  // Route params — all passed from MessagesScreen
  const conversationId = params.conversationId;
  const displayName = params.displayName ?? 'Conversation';
  const listingTitle = params.listingTitle ?? '';
  const avatarUrl = params.avatarUrl ?? '';

  const [messages, setMessages] = useState([]);       // newest-first, raw from RPC
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const flatListRef = useRef(null);
  const oldestIdRef = useRef(null);   // cursor for pagination

  // ── Fetch a page of messages ───────────────────────────────────────────────

  const fetchMessages = useCallback(async ({ beforeId = null, append = false } = {}) => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase.rpc('get_conversation_messages', {
        p_conversation_id: conversationId,
        p_limit: PAGE_SIZE,
        p_before_id: beforeId ?? null,
      });

      if (error) throw error;

      const rows = data ?? [];

      if (append) {
        setMessages((prev) => {
          // Deduplicate by id
          const existing = new Set(prev.map((m) => m.id));
          const fresh = rows.filter((r) => !existing.has(r.id));
          return [...prev, ...fresh];
        });
      } else {
        setMessages(rows);
      }

      setHasMore(rows.length === PAGE_SIZE);
      if (rows.length > 0) {
        // oldest message in this page (last item since RPC orders DESC)
        oldestIdRef.current = rows[rows.length - 1].id;
      }
    } catch (err) {
      console.error('[ConversationScreen] fetchMessages error:', err);
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

  // ── Real-time subscription ─────────────────────────────────────────────────

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new;

          // Skip if it's our own optimistic message already in the list
          if (newMsg.sender_id === profile?.id) {
            // Replace optimistic placeholder with the confirmed message
            setMessages((prev) => {
              const hasOptimistic = prev.some((m) => m._optimistic && m.content === newMsg.content);
              if (hasOptimistic) {
                // Fetch the full row (with sender_username etc.) then replace
                supabase.rpc('get_conversation_messages', {
                  p_conversation_id: conversationId,
                  p_limit: 1,
                  p_before_id: null,
                }).then(({ data }) => {
                  if (data && data[0]) {
                    setMessages((p) => {
                      const filtered = p.filter((m) => !m._optimistic || m.content !== newMsg.content);
                      return [data[0], ...filtered];
                    });
                  }
                });
                return prev; // unchanged until the fetch above completes
              }
              return prev;
            });
            return;
          }

          // Someone else's message — fetch the full row (with profile join)
          const { data } = await supabase.rpc('get_conversation_messages', {
            p_conversation_id: conversationId,
            p_limit: 1,
            p_before_id: null,
          });

          if (data && data[0] && data[0].id === newMsg.id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data[0].id)) return prev;
              return [data[0], ...prev];
            });
          }
        }
      )
      // Update delivery/read status in place
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, status: payload.new.status } : m))
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversationId, profile?.id]);

  // ── Load more (pagination) ─────────────────────────────────────────────────

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || !oldestIdRef.current) return;
    setLoadingMore(true);
    fetchMessages({ beforeId: oldestIdRef.current, append: true });
  }, [loadingMore, hasMore, fetchMessages]);

  // ── Send ───────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const content = inputText.trim();
    if (!content || sending) return;

    setInputText('');
    setSending(true);

    // Optimistic insert (newest-first list, so prepend)
    const optimistic = makeOptimistic(content, profile?.id);
    setMessages((prev) => [optimistic, ...prev]);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(SEND_MESSAGE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversation_id: conversationId,
          content,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);

      // Real-time subscription will replace the optimistic message.
      // If Realtime is slow, do a targeted replace using the returned message_id.
      if (json.message_id) {
        setMessages((prev) =>
          prev.map((m) =>
            m._optimistic && m.content === content
              ? { ...m, id: json.message_id, _optimistic: false, status: 'sent' }
              : m
          )
        );
      }
    } catch (err) {
      console.error('[ConversationScreen] send error:', err);
      // Mark optimistic message as failed
      setMessages((prev) =>
        prev.map((m) =>
          m._optimistic && m.content === content ? { ...m, status: 'failed' } : m
        )
      );
    } finally {
      setSending(false);
    }
  }, [inputText, sending, conversationId, profile?.id]);

  // ── Flatten messages for display (reverse + dividers) ──────────────────────
  // RPC returns DESC (newest first). We reverse to oldest-first for the list,
  // then use inverted FlatList so newest is at the bottom.

  const listData = useMemo(() => {
    // messages state is newest-first; we display as-is with inverted FlatList
    return messages;
  }, [messages]);

  // ── Render item ────────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item, index }) => {
      const isMe = item.sender_id === profile?.id;
      const nextItem = listData[index + 1]; // next in array = older message (inverted)
      // Show avatar when this message is the last in a consecutive group from same sender
      const showAvatar = !nextItem || nextItem.sender_id !== item.sender_id;

      return (
        <MessageBubble
          item={item}
          isMe={isMe}
          showAvatar={showAvatar}
          senderInitials={getInitials(item.sender_username ?? '')}
          senderAvatar={item.sender_avatar_url}
        />
      );
    },
    [listData, profile?.id]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loadingInitial) {
    return (
      <ScreenWrapper bg="#F9FAFB">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={wp(5)} color="#374151" />
          </TouchableOpacity>
          <HeaderAvatar name={displayName} avatarUrl={avatarUrl} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{displayName}</Text>
            {listingTitle ? <Text style={styles.headerSub} numberOfLines={1}>Re: {listingTitle}</Text> : null}
          </View>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3F51B5" />
        </View>
      </ScreenWrapper>
    );
  }

  if (fetchError) {
    return (
      <ScreenWrapper bg="#F9FAFB">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={wp(5)} color="#374151" />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <AlertCircle size={wp(12)} color="#EF4444" />
          <Text style={styles.errorText}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoadingInitial(true); fetchMessages(); }}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper bg="#F9FAFB">
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={wp(5)} color="#374151" />
        </TouchableOpacity>
        <HeaderAvatar name={displayName} avatarUrl={avatarUrl} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{displayName}</Text>
          {listingTitle ? (
            <Text style={styles.headerSub} numberOfLines={1}>Re: {listingTitle}</Text>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Messages — inverted so newest is at bottom */}
        <FlatList
          ref={flatListRef}
          data={listData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          inverted                              // newest at bottom
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}         // fires when user scrolls to top (inverted)
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMoreIndicator}>
                <ActivityIndicator size="small" color="#3F51B5" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyMessagesText}>
                No messages yet. Say hello! 👋
              </Text>
            </View>
          }
          // Perf
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={20}
          windowSize={10}
        />

        {/* Input bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message…"
              value={inputText}
              onChangeText={setInputText}
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={1000}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Send size={wp(4)} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

// ─── Header avatar helper ─────────────────────────────────────────────────────

function HeaderAvatar({ name, avatarUrl }) {
  const initials = getInitials(name);
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />;
  }
  return (
    <View style={styles.headerAvatarFallback}>
      <Text style={styles.headerAvatarText}>{initials}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: hp(2) },

  // Header
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  backButton: {
    width: wp(9), height: wp(9), borderRadius: wp(4.5),
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6',
  },
  headerAvatar: { width: wp(10), height: wp(10), borderRadius: wp(5) },
  headerAvatarFallback: {
    width: wp(10), height: wp(10), borderRadius: wp(5),
    backgroundColor: '#3F51B5', alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: 'white', fontSize: wp(3.5), fontWeight: '600' },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontSize: wp(4.2), fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: wp(2.8), color: '#6B7280', marginTop: hp(0.2) },

  // List
  listContent: { paddingVertical: hp(1.5), paddingBottom: hp(1) },
  loadMoreIndicator: { alignItems: 'center', paddingVertical: hp(1.5) },
  emptyMessages: { flex: 1, alignItems: 'center', paddingTop: hp(10) },
  emptyMessagesText: { color: '#9CA3AF', fontSize: wp(3.5) },

  // Input
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.5),
    paddingBottom: Platform.OS === 'ios' ? hp(3) : hp(1.5),
  },
  inputRow: { flexDirection: 'row', gap: wp(2), alignItems: 'flex-end' },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp(6),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    fontSize: wp(3.8),
    color: '#111827',
    maxHeight: hp(12),
    textAlignVertical: 'top',
  },
  sendButton: {
    width: wp(11), height: wp(11), borderRadius: wp(5.5),
    backgroundColor: '#3F51B5', alignItems: 'center', justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#C7D2FE' },

  // Error
  errorText: { fontSize: wp(3.8), color: '#374151', textAlign: 'center', paddingHorizontal: wp(8) },
  retryBtn: {
    backgroundColor: '#3F51B5', paddingHorizontal: wp(6),
    paddingVertical: hp(1.2), borderRadius: wp(2),
  },
  retryBtnText: { color: 'white', fontWeight: '600', fontSize: wp(3.5) },
});