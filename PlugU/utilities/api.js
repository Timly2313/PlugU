// PlugU API Client (React Native - JS)
// Connects to Supabase Edge Functions

import { supabase } from '../lib/supabase';

const FUNCTIONS_URL = 'https://your-project.supabase.co/functions/v1';

// Helper to make authenticated requests
async function fetchWithAuth(endpoint, options = {}) {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${FUNCTIONS_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Request failed');
  }

  return data.data;
}

// ============================================================
// Posts API
// ============================================================

export const postsApi = {
  getFeed: async (options = {}) => {
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

    return fetchWithAuth(`/getFeed?${params.toString()}`);
  },

  create: async (data) => {
    return fetchWithAuth('/createPost', {
      method: 'POST',
      body: JSON.stringify({
        content: data.content,
        mediaUrls: data.mediaUrls,
        location: data.location,
        coordinates: data.coordinates,
        tagIds: data.tags,
      }),
    });
  },

  like: async (postId) => {
    return fetchWithAuth('/likePost', {
      method: 'POST',
      body: JSON.stringify({ postId }),
    });
  },

  comment: async (postId, content, parentId) => {
    return fetchWithAuth('/commentPost', {
      method: 'POST',
      body: JSON.stringify({ postId, content, parentId }),
    });
  },

  getComments: async (postId) => {
    const { data, error } = await supabase.rpc('get_post_comments', {
      p_post_id: postId,
      p_limit: 50,
      p_offset: 0,
    });

    if (error) throw error;
    return data || [];
  },
};

// ============================================================
// Listings API
// ============================================================

export const listingsApi = {
  create: async (data) => {
    return fetchWithAuth('/createListing', {
      method: 'POST',
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        price: data.price ? parseFloat(data.price) : undefined,
        currency: data.currency,
        priceType: data.priceType,
        category: data.category,
        subcategory: data.subcategory,
        condition: data.condition,
        images: data.images,
        location: data.location,
        coordinates: data.coordinates,
        isNegotiable: data.isNegotiable,
        isShippingAvailable: data.isShippingAvailable,
        isPickupAvailable: data.isPickupAvailable,
        tagIds: data.tags,
      }),
    });
  },

  getUserListings: async (userId, options = {}) => {
    const params = new URLSearchParams();

    if (userId) params.append('userId', userId);
    if (options.status) params.append('status', options.status);
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    return fetchWithAuth(`/getUserListings?${params.toString()}`);
  },

  search: async (query, options = {}) => {
    const { data, error } = await supabase.rpc('search_listings', {
      p_query: query,
      p_category: options.category || null,
      p_min_price: options.minPrice || null,
      p_max_price: options.maxPrice || null,
      p_limit: 20,
      p_offset: 0,
    });

    if (error) throw error;
    return data || [];
  },

  getNearby: async (lat, lng, radius = 10) => {
    const { data, error } = await supabase.rpc('get_nearby_listings', {
      p_latitude: lat,
      p_longitude: lng,
      p_radius_km: radius,
      p_limit: 20,
      p_offset: 0,
    });

    if (error) throw error;
    return data || [];
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url, is_verified)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================================
// Messages API
// ============================================================

export const messagesApi = {
  send: async (data) => {
    return fetchWithAuth('/sendMessage', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: data.conversationId,
        content: data.content,
        mediaUrls: data.mediaUrls,
        replyToId: data.replyToId,
      }),
    });
  },

  getConversation: async (conversationId, limit = 50) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('get_conversation_messages', {
      p_conversation_id: conversationId,
      p_user_id: user.id,
      p_limit: limit,
    });

    if (error) throw error;
    return data || [];
  },

  getOrCreateConversation: async (otherUserId, listingId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_user_id: user.id,
      p_other_user_id: otherUserId,
      p_listing_id: listingId || null,
    });

    if (error) throw error;
    return data;
  },

  getConversations: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_participants!inner(user_id, unread_count),
        participants:conversation_participants(
          user:profiles(id, username, display_name, avatar_url)
        )
      `)
      .eq('conversation_participants.user_id', user.id)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// ============================================================
// Notifications API
// ============================================================

export const notificationsApi = {
  get: async (options = {}) => {
    const params = new URLSearchParams();

    if (options.unreadOnly) params.append('unreadOnly', 'true');
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.markRead) params.append('markRead', 'true');

    return fetchWithAuth(`/fetchNotifications?${params.toString()}`);
  },

  markRead: async (notificationIds) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.rpc('mark_notifications_read', {
      p_user_id: user.id,
      p_notification_ids: notificationIds || null,
    });

    if (error) throw error;
  },

  getUnreadCount: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc(
      'get_unread_notification_count',
      { p_user_id: user.id }
    );

    if (error) throw error;
    return data || 0;
  },
};

// ============================================================
// Storage API
// ============================================================

export const storageApi = {
  uploadImage: async (uri, bucket = 'listings') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const filename = `${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.jpg`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  },

  deleteImage: async (path, bucket = 'listings') => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  },
};

export default {
  posts: postsApi,
  listings: listingsApi,
  messages: messagesApi,
  notifications: notificationsApi,
  storage: storageApi,
};