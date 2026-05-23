import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { MessageCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react-native';
import { hp, wp } from '../../utilities/dimensions';
import ScreenWrapper from '../../components/ScreenWrapper';
import { supabase } from '../../lib/supabase'; // adjust path to your supabase client

// ─── Constants ───────────────────────────────────────────────────────────────

const EDGE_FN_URL =
  'https://ijfvlpcmizlerdtzqkul.supabase.co/functions/v1/get_conversations';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Format a UTC timestamp into a human-readable relative string.
 * Falls back to a short date when older than 7 days.
 */
function formatTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Derive initials from a username or full name string.
 */
function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ─── Skeleton loader for a single row ────────────────────────────────────────

function SkeletonItem() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeletonRow, { opacity }]}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '60%', marginTop: hp(0.8) }]} />
        <View style={[styles.skeletonLine, { width: '35%', marginTop: hp(0.8) }]} />
      </View>
    </Animated.View>
  );
}

// ─── Single conversation row ──────────────────────────────────────────────────

const ConversationItem = React.memo(({ item, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();

  const initials = getInitials(item.other_participant_username || '');
  const timeLabel = formatTime(item.last_message_at);
  const isUnread = (item.unread_count ?? 0) > 0;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => onPress(item.conversation_id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.messageItem,
          isUnread ? styles.unreadMessage : styles.readMessage,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          {item.other_participant_avatar_url ? (
            // If you use expo-image or react-native-fast-image, swap Image here
            <Text style={styles.avatarText}>{initials}</Text>
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>

        {/* Content */}
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.name} numberOfLines={1}>
              {item.other_participant_username ?? 'Unknown'}
            </Text>
            <View style={styles.timeContainer}>
              <Clock size={wp(3)} color="#6B7280" />
              <Text style={styles.time}>{timeLabel}</Text>
            </View>
          </View>

          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message_content ?? 'No messages yet'}
          </Text>

          {item.listing_title ? (
            <Text style={styles.listingTitle} numberOfLines={1}>
              Re: {item.listing_title}
            </Text>
          ) : null}
        </View>

        {/* Unread badge */}
        {isUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {item.unread_count > 99 ? '99+' : item.unread_count}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function MessagesScreen({ onOpenConversation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchConversations = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setError(null);

      // Get current session token
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('You must be logged in to view messages.');
      }

      const response = await fetch(EDGE_FN_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: session.access_token, // supabase edge fn expects apikey header too
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error: ${response.status}`);
      }

      const json = await response.json();
      setConversations(json.conversations ?? []);
    } catch (err) {
      console.error('[MessagesScreen] fetchConversations error:', err);
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Real-time subscription ───────────────────────────────────────────────

  useEffect(() => {
    fetchConversations();

    // Subscribe to new messages so the list stays fresh without manual refresh.
    // We listen on the messages table; on any INSERT we re-fetch quietly.
    const channel = supabase
      .channel('messages-screen-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          fetchConversations({ silent: true });
        }
      )
      // Also listen for unread_count changes on conversation_participants
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
        },
        () => {
          fetchConversations({ silent: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  // ── Pull-to-refresh ──────────────────────────────────────────────────────

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  // ── Render helpers ───────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }) => (
      <ConversationItem item={item} onPress={onOpenConversation} />
    ),
    [onOpenConversation]
  );

  const keyExtractor = useCallback((item) => item.conversation_id, []);

  const renderEmpty = () => {
    if (loading) return null; // skeletons handle this case

    if (error) {
      return (
        <View style={styles.centeredState}>
          <AlertCircle size={wp(14)} color="#EF4444" />
          <Text style={styles.stateTitle}>Couldn't load messages</Text>
          <Text style={styles.stateDescription}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              fetchConversations();
            }}
            activeOpacity={0.8}
          >
            <RefreshCw size={wp(4)} color="white" />
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centeredState}>
        <MessageCircle size={wp(16)} color="#D1D5DB" />
        <Text style={styles.stateTitle}>No messages yet</Text>
        <Text style={styles.stateDescription}>
          When someone contacts you about a listing, you'll see it here.
        </Text>
      </View>
    );
  };

  // ── JSX ──────────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          {loading && !refreshing && (
            <ActivityIndicator size="small" color="#3F51B5" />
          )}
        </View>

        {/* Skeleton state */}
        {loading && conversations.length === 0 && (
          <View>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonItem key={i} />
            ))}
          </View>
        )}

        {/* List */}
        {!loading || conversations.length > 0 ? (
          <FlatList
            data={conversations}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              conversations.length === 0 ? styles.emptyListContent : styles.messagesList
            }
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#3F51B5"
                colors={['#3F51B5']}
              />
            }
            // Performance
            removeClippedSubviews={Platform.OS === 'android'}
            maxToRenderPerBatch={12}
            windowSize={10}
            initialNumToRender={10}
            getItemLayout={(_, index) => ({
              length: hp(10),
              offset: hp(10) * index,
              index,
            })}
          />
        ) : null}
      </View>
    </ScreenWrapper>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  // Header
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#111827',
  },

  // List
  messagesList: {
    flexGrow: 1,
  },
  emptyListContent: {
    flexGrow: 1,
  },

  // Row
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    gap: wp(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    minHeight: hp(10),
  },
  unreadMessage: {
    backgroundColor: 'rgba(63, 81, 181, 0.04)',
  },
  readMessage: {
    backgroundColor: 'white',
  },

  // Avatar
  avatar: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: '#3F51B5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: 'white',
    fontSize: wp(3.5),
    fontWeight: '600',
  },

  // Content
  messageContent: {
    flex: 1,
    minWidth: 0,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: hp(0.4),
    gap: wp(2),
  },
  name: {
    fontSize: wp(3.8),
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.8),
    flexShrink: 0,
  },
  time: {
    fontSize: wp(2.5),
    color: '#6B7280',
  },
  lastMessage: {
    fontSize: wp(3.3),
    color: '#6B7280',
    marginBottom: hp(0.4),
  },
  listingTitle: {
    fontSize: wp(2.5),
    color: '#3F51B5',
  },

  // Unread badge
  unreadBadge: {
    backgroundColor: '#3F51B5',
    borderRadius: wp(3),
    minWidth: wp(5),
    height: wp(5),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(1),
    flexShrink: 0,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: wp(2.5),
    fontWeight: '700',
  },

  // Skeleton
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    gap: wp(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    minHeight: hp(10),
  },
  skeletonAvatar: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: '#E5E7EB',
    flexShrink: 0,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: hp(1.4),
    backgroundColor: '#E5E7EB',
    borderRadius: wp(1),
    width: '80%',
  },

  // Empty / error state
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(8),
    paddingVertical: hp(10),
  },
  stateTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#111827',
    marginTop: hp(2),
    marginBottom: hp(1),
    textAlign: 'center',
  },
  stateDescription: {
    fontSize: wp(3.5),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: hp(2.5),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginTop: hp(3),
    backgroundColor: '#3F51B5',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.4),
    borderRadius: wp(2),
  },
  retryText: {
    color: 'white',
    fontSize: wp(3.5),
    fontWeight: '600',
  },
});