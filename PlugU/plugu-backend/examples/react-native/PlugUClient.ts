/**
 * PlugU React Native Client
 * A comprehensive client for integrating with the PlugU backend
 * 
 * Usage:
 * ```typescript
 * const client = new PlugUClient(supabase);
 * const posts = await client.posts.getFeed({ type: 'personalized' });
 * ```
 */

import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';

// Configuration
const DEFAULT_CONFIG = {
  apiUrl: '', // Will be set from Supabase client
  functionsUrl: '', // Will be set from Supabase client
  defaultLimit: 20,
  maxRetries: 3,
  retryDelay: 1000,
};

// Types
export interface FeedOptions {
  type?: 'personalized' | 'trending' | 'following' | 'user' | 'nearby';
  page?: number;
  limit?: number;
  category?: string;
  location?: string;
  userId?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface CreatePostData {
  content: string;
  mediaUrls?: string[];
  mediaMetadata?: Record<string, any>;
  location?: string;
  coordinates?: { lat: number; lng: number };
  tagIds?: string[];
}

export interface CreateListingData {
  title: string;
  description: string;
  price?: number;
  currency?: string;
  priceType?: string;
  category: string;
  subcategory?: string;
  condition?: string;
  images?: string[];
  location?: string;
  coordinates?: { lat: number; lng: number };
  isNegotiable?: boolean;
  isShippingAvailable?: boolean;
  isPickupAvailable?: boolean;
  expiresAt?: string;
  tagIds?: string[];
}

export interface CreateCommentData {
  postId: string;
  content: string;
  parentId?: string;
}

export interface SendMessageData {
  conversationId: string;
  content: string;
  mediaUrls?: string[];
  replyToId?: string;
}

export interface NotificationOptions {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
  markRead?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  location?: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  is_flagged: boolean;
  status: string;
  created_at: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  is_verified?: boolean;
  is_liked?: boolean;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price?: number;
  currency: string;
  category: string;
  condition?: string;
  images: string[];
  location?: string;
  view_count: number;
  like_count: number;
  inquiry_count: number;
  status: string;
  created_at: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  like_count: number;
  created_at: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  replies?: Comment[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media_urls: string[];
  reply_to_id?: string;
  status: string;
  created_at: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, any>;
  actor?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  title?: string;
  type: string;
  last_message_at: string;
  message_count: number;
  unread_count: number;
  participants?: Profile[];
}

export interface Profile {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  cover_image_url?: string;
  location?: string;
  is_verified: boolean;
  is_premium: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  listing_count: number;
  reputation_score: number;
}

/**
 * Custom error class for PlugU API errors
 */
export class PlugUError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'PlugUError';
  }
}

/**
 * Main PlugU Client class
 */
export class PlugUClient {
  private config: typeof DEFAULT_CONFIG;
  private functionsUrl: string;

  constructor(
    private supabase: SupabaseClient,
    config: Partial<typeof DEFAULT_CONFIG> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.functionsUrl = `${supabase.supabaseUrl}/functions/v1`;
  }

  /**
   * Get current user session
   */
  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw new PlugUError(error.message, 'AUTH_ERROR');
    return data.session;
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) throw new PlugUError(error.message, 'AUTH_ERROR');
    return data.user;
  }

  /**
   * Make authenticated request to Edge Function
   */
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const session = await this.getSession();
    
    if (!session?.access_token) {
      throw new PlugUError('Not authenticated', 'AUTH_REQUIRED', 401);
    }

    const url = `${this.functionsUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new PlugUError(
        data.error?.message || 'Request failed',
        data.error?.code || 'REQUEST_FAILED',
        response.status,
        data.error?.details
      );
    }

    return data;
  }

  /**
   * Posts API
   */
  posts = {
    /**
     * Get feed posts
     */
    getFeed: async (options: FeedOptions = {}): Promise<PaginatedResponse<Post>> => {
      const params = new URLSearchParams();
      if (options.type) params.append('type', options.type);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.category) params.append('category', options.category);
      if (options.location) params.append('location', options.location);
      if (options.userId) params.append('userId', options.userId);
      if (options.lat) params.append('lat', options.lat.toString());
      if (options.lng) params.append('lng', options.lng.toString());
      if (options.radius) params.append('radius', options.radius.toString());

      const response = await this.fetch<{ data: PaginatedResponse<Post> }>(
        `/getFeed?${params.toString()}`
      );
      return response.data;
    },

    /**
     * Create a new post
     */
    create: async (data: CreatePostData): Promise<Post> => {
      const response = await this.fetch<{ data: { post: Post } }>('/createPost', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data.post;
    },

    /**
     * Like/unlike a post
     */
    like: async (postId: string): Promise<{ liked: boolean; like_count: number }> => {
      const response = await this.fetch<{ data: { liked: boolean; post_id: string; like_count: number } }>(
        '/likePost',
        {
          method: 'POST',
          body: JSON.stringify({ postId }),
        }
      );
      return {
        liked: response.data.liked,
        like_count: response.data.like_count,
      };
    },

    /**
     * Comment on a post
     */
    comment: async (data: CreateCommentData): Promise<Comment> => {
      const response = await this.fetch<{ data: { comment: Comment } }>('/commentPost', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data.comment;
    },

    /**
     * Get post comments (direct Supabase query)
     */
    getComments: async (postId: string): Promise<Comment[]> => {
      const { data, error } = await this.supabase
        .rpc('get_post_comments', {
          p_post_id: postId,
          p_limit: 50,
          p_offset: 0,
        });

      if (error) throw new PlugUError(error.message, 'DB_ERROR');
      return data || [];
    },

    /**
     * Subscribe to post changes (realtime)
     */
    subscribe: (callback: (payload: any) => void) => {
      return this.supabase
        .channel('public:posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, callback)
        .subscribe();
    },
  };

  /**
   * Listings API
   */
  listings = {
    /**
     * Create a new listing
     */
    create: async (data: CreateListingData): Promise<Listing> => {
      const response = await this.fetch<{ data: { listing: Listing } }>('/createListing', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data.listing;
    },

    /**
     * Get user's listings
     */
    getUserListings: async (
      userId?: string,
      options: { status?: string; page?: number; limit?: number } = {}
    ): Promise<PaginatedResponse<Listing>> => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (options.status) params.append('status', options.status);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await this.fetch<{ data: PaginatedResponse<Listing> }>(
        `/getUserListings?${params.toString()}`
      );
      return response.data;
    },

    /**
     * Search listings (direct Supabase query)
     */
    search: async (query: string, options: { category?: string; minPrice?: number; maxPrice?: number } = {}): Promise<Listing[]> => {
      const { data, error } = await this.supabase
        .rpc('search_listings', {
          p_query: query,
          p_category: options.category || null,
          p_min_price: options.minPrice || null,
          p_max_price: options.maxPrice || null,
          p_limit: 20,
          p_offset: 0,
        });

      if (error) throw new PlugUError(error.message, 'DB_ERROR');
      return data || [];
    },

    /**
     * Get nearby listings
     */
    getNearby: async (lat: number, lng: number, radius: number = 10): Promise<Listing[]> => {
      const { data, error } = await this.supabase
        .rpc('get_nearby_listings', {
          p_latitude: lat,
          p_longitude: lng,
          p_radius_km: radius,
          p_limit: 20,
          p_offset: 0,
        });

      if (error) throw new PlugUError(error.message, 'DB_ERROR');
      return data || [];
    },

    /**
     * Subscribe to listing changes (realtime)
     */
    subscribe: (callback: (payload: any) => void) => {
      return this.supabase
        .channel('public:listings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, callback)
        .subscribe();
    },
  };

  /**
   * Messages API
   */
  messages = {
    /**
     * Send a message
     */
    send: async (data: SendMessageData): Promise<Message> => {
      const response = await this.fetch<{ data: { message: Message } }>('/sendMessage', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data.message;
    },

    /**
     * Get conversation messages
     */
    getConversation: async (conversationId: string, limit: number = 50): Promise<Message[]> => {
      const { data, error } = await this.supabase
        .rpc('get_conversation_messages', {
          p_conversation_id: conversationId,
          p_user_id: (await this.getCurrentUser()).id,
          p_limit: limit,
        });

      if (error) throw new PlugUError(error.message, 'DB_ERROR');
      return data || [];
    },

    /**
     * Get or create conversation
     */
    getOrCreateConversation: async (otherUserId: string, listingId?: string): Promise<string> => {
      const { data, error } = await this.supabase
        .rpc('get_or_create_conversation', {
          p_user_id: (await this.getCurrentUser()).id,
          p_other_user_id: otherUserId,
          p_listing_id: listingId || null,
        });

      if (error) throw new PlugUError(error.message, 'DB_ERROR');
      return data;
    },

    /**
     * Get user's conversations
     */
    getConversations: async (): Promise<Conversation[]> => {
      const { data, error } = await this.supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(user_id),
          participants:conversation_participants(
            user:profiles(id, username, display_name, avatar_url)
          )
        `)
        .eq('conversation_participants.user_id', (await this.getCurrentUser()).id)
        .order('last_message_at', { ascending: false });

      if (error) throw new PlugUError(error.message, 'DB_ERROR');
      return data || [];
    },

    /**
     * Subscribe to message changes (realtime)
     */
    subscribe: (conversationId: string, callback: (payload: any) => void) => {
      return this.supabase
        .channel(`conversation:${conversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        }, callback)
        .subscribe();
    },
  };

  /**
   * Notifications API
   */
  notifications = {
    /**
     * Get notifications
     */
    get: async (options: NotificationOptions = {}): Promise<{ notifications: Notification[]; unread_count: number }> => {
      const params = new URLSearchParams();
      if (options.unreadOnly) params.append('unreadOnly', 'true');
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.markRead) params.append('markRead', 'true');

      const response = await this.fetch<{ data: { notifications: Notification[]; unread_count: number } }>(
        `/fetchNotifications?${params.toString()}`
      );
      return response.data;
    },

    /**
     * Mark notifications as read
     */
    markRead: async (notificationIds?: string[]): Promise<void> => {
      const { error } = await this.supabase
        .rpc('mark_notifications_read', {
          p_user_id: (await this.getCurrentUser()).id,
          p_notification_ids: notificationIds || null,
        });

      if (error) throw new PlugUError(error.message, 'DB_ERROR');
    },

    /**
     * Get unread count
     */
    getUnreadCount: async (): Promise<number> => {
      const { data, error } = await this.supabase
        .rpc('get_unread_notification_count', {
          p_user_id: (await this.getCurrentUser()).id,
        });

      if (error) throw new PlugUError(error.message, 'DB_ERROR');
      return data || 0;
    },

    /**
     * Subscribe to notification changes (realtime)
     */
    subscribe: (callback: (payload: any) => void) => {
      return this.supabase
        .channel('public:notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.getCurrentUser().then(u => u.id)}`,
        }, callback)
        .subscribe();
    },
  };

  /**
   * Users API
   */
  users = {
    /**
     * Get user profile
     */
    getProfile: async (userId?: string): Promise<Profile> => {
      const targetId = userId || (await this.getCurrentUser()).id;
      
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();

      if (error) throw new PlugUError(error.message, 'DB_ERROR');
      return data;
    },

    /**
     * Update user profile
     */
    updateProfile: async (updates: Partial<Profile>): Promise<Profile> => {
      const { data, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', (await this.getCurrentUser()).id)
        .select()
        .single();

      if (error) throw new PlugUError(error.message, 'DB_ERROR');
      return data;
    },

    /**
     * Follow/unfollow user
     */
    follow: async (userId: string): Promise<{ following: boolean }> => {
      const { data, error } = await this.supabase
        .rpc('toggle_follow_user', {
          p_follower_id: (await this.getCurrentUser()).id,
          p_followed_id: userId,
        });

      if (error) throw new PlugUError(error.message, 'DB_ERROR');
      return data;
    },

    /**
     * Get user stats
     */
    getStats: async (userId?: string): Promise<Record<string, any>> => {
      const targetId = userId || (await this.getCurrentUser()).id;
      
      const { data, error } = await this.supabase
        .rpc('get_user_stats', {
          p_user_id: targetId,
        });

      if (error) throw new PlugUError(error.message, 'DB_ERROR');
      return data;
    },
  };

  /**
   * Moderation API
   */
  moderation = {
    /**
     * Check text content
     */
    checkText: async (text: string, contentType: string = 'post'): Promise<any> => {
      const response = await this.fetch<{ data: { result: any } }>('/moderateContent', {
        method: 'POST',
        body: JSON.stringify({
          type: 'text',
          content: text,
          contentType,
        }),
      });
      return response.data.result;
    },

    /**
     * Check image content
     */
    checkImage: async (imageUrl: string, contentType: string = 'post'): Promise<any> => {
      const response = await this.fetch<{ data: { result: any } }>('/moderateContent', {
        method: 'POST',
        body: JSON.stringify({
          type: 'image',
          imageUrl,
          contentType,
        }),
      });
      return response.data.result;
    },

    /**
     * Validate email
     */
    validateEmail: async (email: string): Promise<any> => {
      const response = await this.fetch<{ data: { result: any } }>('/moderateContent', {
        method: 'POST',
        body: JSON.stringify({
          type: 'email',
          email,
        }),
      });
      return response.data.result;
    },

    /**
     * Validate phone
     */
    validatePhone: async (phone: string): Promise<any> => {
      const response = await this.fetch<{ data: { result: any } }>('/moderateContent', {
        method: 'POST',
        body: JSON.stringify({
          type: 'phone',
          phone,
        }),
      });
      return response.data.result;
    },
  };
}

export default PlugUClient;
