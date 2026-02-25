/**
 * PlugU React Native Hooks
 * Custom hooks for easy integration with PlugU backend
 * 
 * Usage:
 * ```typescript
 * function MyComponent() {
 *   const { posts, loading, error, refresh } = useFeed({ type: 'personalized' });
 *   // ...
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { 
  PlugUClient, 
  PlugUError,
  Post, 
  Listing, 
  Comment, 
  Message, 
  Notification,
  Conversation,
  Profile,
  FeedOptions,
  CreatePostData,
  CreateListingData,
  CreateCommentData,
  SendMessageData,
  NotificationOptions,
  PaginatedResponse,
} from './PlugUClient';

// ============================================================================
// useFeed Hook
// ============================================================================

interface UseFeedOptions extends FeedOptions {
  autoLoad?: boolean;
}

export function useFeed(options: UseFeedOptions = {}, supabase: SupabaseClient) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<PlugUError | null>(null);
  const [pagination, setPagination] = useState<PaginatedResponse<Post>['pagination'] | null>(null);
  
  const clientRef = useRef(new PlugUClient(supabase));

  const fetchFeed = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (page === 1) {
        isRefresh ? setRefreshing(true) : setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await clientRef.current.posts.getFeed({
        ...options,
        page,
      });

      setPagination(response.pagination);

      if (page === 1) {
        setPosts(response.data);
      } else {
        setPosts(prev => [...prev, ...response.data]);
      }
    } catch (err) {
      setError(err instanceof PlugUError ? err : new PlugUError('Unknown error', 'UNKNOWN'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [options]);

  const refresh = useCallback(() => fetchFeed(1, true), [fetchFeed]);
  const loadMore = useCallback(() => {
    if (pagination?.has_more && !loadingMore) {
      fetchFeed((pagination?.page || 1) + 1);
    }
  }, [pagination, loadingMore, fetchFeed]);

  useEffect(() => {
    if (options.autoLoad !== false) {
      fetchFeed();
    }
  }, [fetchFeed, options.autoLoad]);

  // Subscribe to realtime updates
  useEffect(() => {
    const subscription = clientRef.current.posts.subscribe((payload) => {
      if (payload.eventType === 'INSERT') {
        setPosts(prev => [payload.new as Post, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setPosts(prev => 
          prev.map(post => 
            post.id === payload.new.id ? { ...post, ...payload.new } : post
          )
        );
      } else if (payload.eventType === 'DELETE') {
        setPosts(prev => prev.filter(post => post.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    posts,
    loading,
    refreshing,
    loadingMore,
    error,
    pagination,
    refresh,
    loadMore,
  };
}

// ============================================================================
// useCreatePost Hook
// ============================================================================

export function useCreatePost(supabase: SupabaseClient) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PlugUError | null>(null);
  const clientRef = useRef(new PlugUClient(supabase));

  const createPost = useCallback(async (data: CreatePostData): Promise<Post | null> => {
    try {
      setLoading(true);
      setError(null);
      const post = await clientRef.current.posts.create(data);
      return post;
    } catch (err) {
      setError(err instanceof PlugUError ? err : new PlugUError('Unknown error', 'UNKNOWN'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createPost, loading, error };
}

// ============================================================================
// useLikePost Hook
// ============================================================================

export function useLikePost(supabase: SupabaseClient) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<PlugUError | null>(null);
  const clientRef = useRef(new PlugUClient(supabase));

  const likePost = useCallback(async (postId: string): Promise<{ liked: boolean; like_count: number } | null> => {
    try {
      setLoading(postId);
      setError(null);
      const result = await clientRef.current.posts.like(postId);
      return result;
    } catch (err) {
      setError(err instanceof PlugUError ? err : new PlugUError('Unknown error', 'UNKNOWN'));
      return null;
    } finally {
      setLoading(null);
    }
  }, []);

  return { likePost, loading, error };
}

// ============================================================================
// useComments Hook
// ============================================================================

export function useComments(postId: string, supabase: SupabaseClient) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PlugUError | null>(null);
  const clientRef = useRef(new PlugUClient(supabase));

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientRef.current.posts.getComments(postId);
      setComments(data);
    } catch (err) {
      setError(err instanceof PlugUError ? err : new PlugUError('Unknown error', 'UNKNOWN'));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const addComment = useCallback(async (data: Omit<CreateCommentData, 'postId'>): Promise<Comment | null> => {
    try {
      setLoading(true);
      setError(null);
      const comment = await clientRef.current.posts.comment({ ...data, postId });
      setComments(prev => [comment, ...prev]);
      return comment;
    } catch (err) {
      setError(err instanceof PlugUError ? err : new PlugUError('Unknown error', 'UNKNOWN'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { comments, loading, error, refresh: fetchComments, addComment };
}

// ============================================================================
// useListings Hook
// ============================================================================

interface UseListingsOptions {
  userId?: string;
  status?: string;
  autoLoad?: boolean;
}

export function useListings(options: UseListingsOptions = {}, supabase: SupabaseClient) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<PlugUError | null>(null);
  const [pagination, setPagination] = useState<PaginatedResponse<Listing>['pagination'] | null>(null);
  
  const clientRef = useRef(new PlugUClient(supabase));

  const fetchListings = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (page === 1) {
        isRefresh ? setRefreshing(true) : setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await clientRef.current.listings.getUserListings(options.userId, {
        status: options.status,
        page,
      });

      setPagination(response.pagination);

      if (page === 1) {
        setListings(response.data);
      } else {
        setListings(prev => [...prev, ...response.data]);
      }
    } catch (err) {
      setError(err instanceof PlugUError ? err : new PlugUError('Unknown error', 'UNKNOWN'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [options.userId, options.status]);

  const refresh = useCallback(() => fetchListings(1, true), [fetchListings]);
  const loadMore = useCallback(() => {
    if (pagination?.has_more && !loadingMore) {
      fetchListings((pagination?.page || 1) + 1);
    }
  }, [pagination, loadingMore, fetchListings]);

  useEffect(() => {
    if (options.autoLoad !== false) {
      fetchListings();
    }
  }, [fetchListings, options.autoLoad]);

  return {
    listings,
    loading,
    refreshing,
    loadingMore,
    error,
    pagination,
    refresh,
    loadMore,
  };
}

// ============================================================================
// useCreateListing Hook
// ============================================================================

export function useCreateListing(supabase: SupabaseClient) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PlugUError | null>(null);
  const clientRef = useRef(new PlugUClient(supabase));

  const createListing = useCallback(async (data: CreateListingData): Promise<Listing | null> => {
    try {
      setLoading(true);
      setError(null);
      const listing = await clientRef.current.listings.create(data);
      return listing;
    } catch (err) {
      setError(err instanceof PlugUError ? err : new PlugUError('Unknown error', 'UNKNOWN'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createListing, loading, error };
}

// ============================================================================
// useMessages Hook
// ============================================================================

export function useMessages(conversationId: string, supabase: SupabaseClient) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PlugUError | null>(null);
  const [sending, setSending] = useState(false);
  const clientRef = useRef(new PlugUClient(supabase));

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientRef.current.messages.getConversation(conversationId);
      setMessages(data.reverse()); // Reverse to show oldest first
    } catch (err) {
      setError(err instanceof PlugUError ? err : new PlugUError('Unknown error', 'UNKNOWN'));
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string, mediaUrls?: string[]): Promise<Message | null> => {
    try {
      setSending(true);
      setError(null);
      const message = await clientRef.current.messages.send({
        conversationId,
        content,
        mediaUrls,
      });
      setMessages(prev => [...prev, message]);
      return message;
    } catch (err) {
      setError(err instanceof PlugUError ? err : new PlugUError('Unknown error', 'UNKNOWN'));
      return null;
    } finally {
      setSending(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime messages
  useEffect(() => {
    const subscription = clientRef.current.messages.subscribe(conversationId, (payload) => {
      if (payload.eventType === 'INSERT') {
        setMessages(prev => [...prev, payload.new as Message]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  return { messages, loading, sending, error, refresh: fetchMessages, sendMessage };
}

// ============================================================================
// useConversations Hook
// ============================================================================

export function useConversations(supabase: SupabaseClient) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PlugUError | null>(null);
  const clientRef = useRef(new PlugUClient(supabase));

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientRef.current.messages.getConversations();
      setConversations(data);
    } catch (err) {
      setError(err instanceof PlugUError ? err : new PlugUError('Unknown error', 'UNKNOWN'));
    } finally {
      setLoading(false);
    }
  }, []);

  const startConversation = useCallback(async (userId: string, listingId?: string): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      const conversationId = await clientRef.current.messages.getOrCreateConversation(userId, listingId);
      await fetchConversations();
      return conversationId;
    } catch (err) {
      setError(err instanceof PlugUError ? err : new PlugUError('Unknown error', 'UNKNOWN'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, error, refresh: fetchConversations, startConversation };
}

// ============================================================================
// useNotifications Hook
// ============================================================================

export function useNotifications(options: NotificationOptions = {}, supabase: SupabaseClient) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<PlugUError | null>(null);
  const clientRef = useRef(new PlugUClient(supabase));

  const fetchNotifications = useCallback(async (isRefresh: boolean = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const data = await clientRef.current.notifications.get(options);
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (err) {
      setError(err instanceof PlugUError ? err : new PlugUError('Unknown error', 'UNKNOWN'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [options]);

  const markRead = useCallback(async (notificationIds?: string[]) => {
    try {
      await clientRef.current.notifications.markRead(notificationIds);
      if (notificationIds) {
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, is_read: true } : n
          )
        );
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to realtime notifications
  useEffect(() => {
    const subscription = clientRef.current.notifications.subscribe((payload) => {
      if (payload.eventType === 'INSERT') {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    refreshing,
    error,
    refresh: () => fetchNotifications(true),
    markRead,
  };
}

// ============================================================================
// useUser Hook
// ============================================================================

export function useUser(supabase: SupabaseClient) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PlugUError | null>(null);
  const clientRef = useRef(new PlugUClient(supabase));

  const fetchProfile = useCallback(async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientRef.current.users.getProfile(userId);
      setProfile(data);
    } catch (err) {
      setError(err instanceof PlugUError ? err : new PlugUError('Unknown error', 'UNKNOWN'));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>): Promise<Profile | null> => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientRef.current.users.updateProfile(updates);
      setProfile(data);
      return data;
    } catch (err) {
      setError(err instanceof PlugUError ? err : new PlugUError('Unknown error', 'UNKNOWN'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const followUser = useCallback(async (userId: string): Promise<{ following: boolean } | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await clientRef.current.users.follow(userId);
      return result;
    } catch (err) {
      setError(err instanceof PlugUError ? err : new PlugUError('Unknown error', 'UNKNOWN'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    followUser,
  };
}

// ============================================================================
// usePlugU Hook (Combined)
// ============================================================================

export function usePlugU(supabase: SupabaseClient) {
  const clientRef = useRef(new PlugUClient(supabase));

  return {
    client: clientRef.current,
    posts: {
      useFeed: (options?: FeedOptions) => useFeed(options, supabase),
      useCreate: () => useCreatePost(supabase),
      useLike: () => useLikePost(supabase),
      useComments: (postId: string) => useComments(postId, supabase),
    },
    listings: {
      useListings: (options?: { userId?: string; status?: string }) => useListings(options, supabase),
      useCreate: () => useCreateListing(supabase),
    },
    messages: {
      useMessages: (conversationId: string) => useMessages(conversationId, supabase),
      useConversations: () => useConversations(supabase),
    },
    notifications: {
      useNotifications: (options?: NotificationOptions) => useNotifications(options, supabase),
    },
    users: {
      useUser: () => useUser(supabase),
    },
  };
}

export default usePlugU;
