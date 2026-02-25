/**
 * PlugU React Native Example Components
 * Shows how to use the PlugU hooks in React Native components
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import {
  useFeed,
  useCreatePost,
  useLikePost,
  useComments,
  useListings,
  useMessages,
  useConversations,
  useNotifications,
  useUser,
} from './usePlugU';

// Initialize Supabase client
const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// ============================================================================
// Feed Component Example
// ============================================================================

export function FeedExample() {
  const { posts, loading, refreshing, loadingMore, error, refresh, loadMore } = useFeed(
    { type: 'personalized', limit: 20 },
    supabase
  );

  const { likePost, loading: likeLoading } = useLikePost(supabase);

  const handleLike = async (postId: string) => {
    await likePost(postId);
  };

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Image
          source={{ uri: item.avatar_url || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.displayName}>{item.display_name}</Text>
          <Text style={styles.username}>@{item.username}</Text>
        </View>
      </View>

      <Text style={styles.postContent}>{item.content}</Text>

      {item.media_urls?.length > 0 && (
        <Image
          source={{ uri: item.media_urls[0] }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.postActions}>
        <TouchableOpacity
          onPress={() => handleLike(item.id)}
          disabled={likeLoading === item.id}
        >
          <Text style={styles.actionButton}>
            {item.is_liked ? '❤️' : '🤍'} {item.like_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.actionButton}>
            💬 {item.comment_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.actionButton}>
            🔄 {item.share_count}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
        <TouchableOpacity onPress={refresh}>
          <Text style={styles.retryButton}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loadingMore ? <ActivityIndicator /> : null}
    />
  );
}

// ============================================================================
// Create Post Component Example
// ============================================================================

export function CreatePostExample() {
  const [content, setContent] = useState('');
  const { createPost, loading, error } = useCreatePost(supabase);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    const post = await createPost({
      content: content.trim(),
      location: 'New York, NY',
    });

    if (post) {
      setContent('');
      // Post created successfully
    }
  };

  return (
    <View style={styles.createPostContainer}>
      <TextInput
        style={styles.textInput}
        placeholder="What's on your mind?"
        value={content}
        onChangeText={setContent}
        multiline
        maxLength={5000}
      />

      {error && (
        <Text style={styles.errorText}>{error.message}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading || !content.trim()}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Posting...' : 'Post'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// Comments Component Example
// ============================================================================

export function CommentsExample({ postId }: { postId: string }) {
  const [newComment, setNewComment] = useState('');
  const { comments, loading, error, refresh, addComment } = useComments(postId, supabase);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    await addComment({ content: newComment.trim() });
    setNewComment('');
  };

  const renderComment = ({ item }: { item: any }) => (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <Image
          source={{ uri: item.avatar_url || 'https://via.placeholder.com/30' }}
          style={styles.smallAvatar}
        />
        <Text style={styles.commentAuthor}>{item.display_name}</Text>
      </View>
      <Text style={styles.commentContent}>{item.content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      />

      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
        />
        <TouchableOpacity onPress={handleSubmit}>
          <Text style={styles.sendButton}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// Listings Component Example
// ============================================================================

export function ListingsExample({ userId }: { userId?: string }) {
  const { listings, loading, refreshing, error, refresh, loadMore } = useListings(
    { userId },
    supabase
  );

  const renderListing = ({ item }: { item: any }) => (
    <View style={styles.listingCard}>
      {item.images?.length > 0 && (
        <Image
          source={{ uri: item.images[0] }}
          style={styles.listingImage}
        />
      )}

      <View style={styles.listingContent}>
        <Text style={styles.listingTitle}>{item.title}</Text>
        <Text style={styles.listingPrice}>
          {item.price ? `$${item.price}` : 'Contact for price'}
        </Text>
        <Text style={styles.listingLocation}>{item.location}</Text>

        <View style={styles.listingStats}>
          <Text>👁 {item.view_count}</Text>
          <Text>❤️ {item.like_count}</Text>
          <Text>💬 {item.inquiry_count}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <FlatList
      data={listings}
      renderItem={renderListing}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
    />
  );
}

// ============================================================================
// Messages Component Example
// ============================================================================

export function MessagesExample({ conversationId }: { conversationId: string }) {
  const [newMessage, setNewMessage] = useState('');
  const { messages, loading, sending, error, sendMessage } = useMessages(conversationId, supabase);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    await sendMessage(newMessage.trim());
    setNewMessage('');
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View
      style={[
        styles.messageBubble,
        item.is_me ? styles.myMessage : styles.theirMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.content}</Text>
      <Text style={styles.messageTime}>
        {new Date(item.created_at).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
      />

      <View style={styles.messageInputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending}
        >
          <Text style={styles.sendButton}>
            {sending ? '...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// Notifications Component Example
// ============================================================================

export function NotificationsExample() {
  const { notifications, unreadCount, loading, refreshing, refresh, markRead } = useNotifications(
    { unreadOnly: false },
    supabase
  );

  const renderNotification = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.is_read && styles.unreadNotification,
      ]}
      onPress={() => markRead([item.id])}
    >
      <Image
        source={{ uri: item.actor?.avatar_url || 'https://via.placeholder.com/40' }}
        style={styles.avatar}
      />
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <Text style={styles.notificationTime}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.notificationHeader}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markRead()}>
            <Text style={styles.markAllRead}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      />
    </View>
  );
}

// ============================================================================
// User Profile Component Example
// ============================================================================

export function UserProfileExample({ userId }: { userId?: string }) {
  const { profile, loading, error, followUser } = useUser(supabase);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.center}>
        <Text>Error loading profile</Text>
      </View>
    );
  }

  return (
    <View style={styles.profileContainer}>
      <Image
        source={{ uri: profile.cover_image_url || 'https://via.placeholder.com/400x150' }}
        style={styles.coverImage}
      />

      <View style={styles.profileHeader}>
        <Image
          source={{ uri: profile.avatar_url || 'https://via.placeholder.com/100' }}
          style={styles.profileAvatar}
        />

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {profile.display_name || profile.username}
            {profile.is_verified && <Text> ✓</Text>}
          </Text>
          <Text style={styles.profileUsername}>@{profile.username}</Text>
        </View>

        <TouchableOpacity
          style={styles.followButton}
          onPress={() => followUser(profile.id)}
        >
          <Text style={styles.followButtonText}>Follow</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.profileBio}>{profile.bio}</Text>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{profile.post_count}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{profile.follower_count}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{profile.following_count}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Post styles
  postCard: {
    backgroundColor: 'white',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    fontSize: 14,
    color: '#666',
  },

  // Create post styles
  createPostContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Comment styles
  commentCard: {
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  smallAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Listing styles
  listingCard: {
    backgroundColor: 'white',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listingImage: {
    width: '100%',
    height: 200,
  },
  listingContent: {
    padding: 16,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  listingLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  listingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  // Message styles
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    marginHorizontal: 12,
  },
  myMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: 'white',
  },
  messageTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  messageInputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },

  // Notification styles
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  markAllRead: {
    color: '#007AFF',
    fontSize: 14,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  unreadNotification: {
    backgroundColor: '#F0F8FF',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },

  // Profile styles
  profileContainer: {
    backgroundColor: 'white',
  },
  coverImage: {
    width: '100%',
    height: 150,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    marginTop: -50,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
    marginBottom: 8,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileUsername: {
    fontSize: 16,
    color: '#666',
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  followButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  profileBio: {
    padding: 16,
    fontSize: 15,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  // Error styles
  errorText: {
    color: 'red',
    marginBottom: 12,
  },
  retryButton: {
    color: '#007AFF',
    fontSize: 16,
  },
});

export default {
  FeedExample,
  CreatePostExample,
  CommentsExample,
  ListingsExample,
  MessagesExample,
  NotificationsExample,
  UserProfileExample,
};
