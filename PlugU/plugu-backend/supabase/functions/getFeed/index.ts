/**
 * PlugU Edge Function: getFeed
 * Retrieves personalized feed for the authenticated user
 * 
 * @method GET
 * @query { type, page, limit, category, location, userId }
 * @returns { posts, pagination }
 */

import { createServiceClient, createUserClient } from '../_shared/db.ts';
import { authMiddleware, optionalAuth } from '../_shared/auth.ts';
import { response, errors, handleCORS, parseQueryParams, parsePagination } from '../_shared/response.ts';
import { validate } from '../_shared/validate.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FeedQueryParams {
  type?: 'personalized' | 'trending' | 'following' | 'user' | 'nearby';
  page?: string;
  limit?: string;
  category?: string;
  location?: string;
  userId?: string;
  lat?: string;
  lng?: string;
  radius?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  const startTime = Date.now();

  try {
    // Parse query parameters
    const params = parseQueryParams(req) as FeedQueryParams;
    const pagination = parsePagination(params);
    
    // Validate feed type
    const feedType = params.type || 'personalized';
    const validTypes = ['personalized', 'trending', 'following', 'user', 'nearby'];
    
    if (!validTypes.includes(feedType)) {
      return errors.validationError('Invalid feed type', {
        validTypes,
        provided: feedType,
      });
    }

    // Optional authentication (for personalized feeds)
    const user = await optionalAuth(req);
    
    // Require auth for personalized and following feeds
    if ((feedType === 'personalized' || feedType === 'following') && !user) {
      return errors.unauthorized('Authentication required for this feed type');
    }

    // Create Supabase client
    const supabase = createServiceClient();

    let posts: any[] = [];
    let totalCount = 0;

    switch (feedType) {
      case 'personalized':
        // Use personalized feed RPC
        const { data: personalizedPosts, error: personalizedError } = await supabase.rpc(
          'get_personalized_feed',
          {
            p_user_id: user!.id,
            p_limit: pagination.limit,
            p_offset: (pagination.page - 1) * pagination.limit,
          }
        );

        if (personalizedError) {
          console.error('Error fetching personalized feed:', personalizedError);
          return errors.internalError('Failed to fetch feed');
        }

        posts = personalizedPosts || [];
        
        // Get total count for pagination
        const { count: personalizedCount } = await supabase
          .from('feed_posts_view')
          .select('*', { count: 'exact', head: true });
        totalCount = personalizedCount || 0;
        break;

      case 'trending':
        // Use trending feed RPC
        const { data: trendingPosts, error: trendingError } = await supabase.rpc(
          'get_trending_feed',
          {
            p_limit: pagination.limit,
            p_offset: (pagination.page - 1) * pagination.limit,
          }
        );

        if (trendingError) {
          console.error('Error fetching trending feed:', trendingError);
          return errors.internalError('Failed to fetch feed');
        }

        posts = trendingPosts || [];
        
        // Get total count
        const { count: trendingCount } = await supabase
          .from('trending_content_view')
          .select('*', { count: 'exact', head: true });
        totalCount = trendingCount || 0;
        break;

      case 'following':
        // Get posts from users the current user follows
        const { data: followingPosts, error: followingError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id (username, display_name, avatar_url, is_verified)
          `)
          .in('user_id', (
            supabase
              .from('user_likes')
              .select('liked_id')
              .eq('liker_id', user!.id)
          ))
          .eq('status', 'active')
          .eq('is_flagged', false)
          .order('created_at', { ascending: false })
          .range(
            (pagination.page - 1) * pagination.limit,
            pagination.page * pagination.limit - 1
          );

        if (followingError) {
          console.error('Error fetching following feed:', followingError);
          return errors.internalError('Failed to fetch feed');
        }

        posts = followingPosts || [];
        
        // Get total count
        const { count: followingCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .in('user_id', (
            supabase
              .from('user_likes')
              .select('liked_id')
              .eq('liker_id', user!.id)
          ))
          .eq('status', 'active')
          .eq('is_flagged', false);
        totalCount = followingCount || 0;
        break;

      case 'user':
        // Get posts from specific user
        if (!params.userId) {
          return errors.badRequest('userId is required for user feed');
        }

        // Validate UUID
        const userIdValidation = validate('userId', params.userId).isUUID();
        if (!userIdValidation.isValid()) {
          return errors.validationError('Invalid userId');
        }

        const { data: userPosts, error: userError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id (username, display_name, avatar_url, is_verified)
          `)
          .eq('user_id', params.userId)
          .eq('status', 'active')
          .eq('is_flagged', false)
          .order('created_at', { ascending: false })
          .range(
            (pagination.page - 1) * pagination.limit,
            pagination.page * pagination.limit - 1
          );

        if (userError) {
          console.error('Error fetching user feed:', userError);
          return errors.internalError('Failed to fetch feed');
        }

        posts = userPosts || [];
        
        // Get total count
        const { count: userCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', params.userId)
          .eq('status', 'active')
          .eq('is_flagged', false);
        totalCount = userCount || 0;
        break;

      case 'nearby':
        // Get posts near a location
        if (!params.lat || !params.lng) {
          return errors.badRequest('lat and lng are required for nearby feed');
        }

        const lat = parseFloat(params.lat);
        const lng = parseFloat(params.lng);
        const radius = parseFloat(params.radius || '10');

        if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
          return errors.validationError('Invalid coordinates or radius');
        }

        // Use PostGIS for nearby query
        const { data: nearbyPosts, error: nearbyError } = await supabase.rpc(
          'get_nearby_posts',
          {
            p_latitude: lat,
            p_longitude: lng,
            p_radius_km: radius,
            p_limit: pagination.limit,
            p_offset: (pagination.page - 1) * pagination.limit,
          }
        );

        if (nearbyError) {
          console.error('Error fetching nearby feed:', nearbyError);
          // Fallback to simple query without distance
          const { data: fallbackPosts } = await supabase
            .from('posts')
            .select(`
              *,
              profiles:user_id (username, display_name, avatar_url, is_verified)
            `)
            .eq('status', 'active')
            .eq('is_flagged', false)
            .not('coordinates', 'is', null)
            .order('created_at', { ascending: false })
            .limit(pagination.limit);
          
          posts = fallbackPosts || [];
        } else {
          posts = nearbyPosts || [];
        }

        totalCount = posts.length; // Approximate for nearby
        break;
    }

    // Check if user has liked each post (if authenticated)
    if (user && posts.length > 0) {
      const postIds = posts.map(p => p.id);
      
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);

      const likedPostIds = new Set(likes?.map(l => l.post_id) || []);
      
      posts = posts.map(post => ({
        ...post,
        is_liked: likedPostIds.has(post.id),
      }));
    }

    // Build response
    const hasMore = pagination.page * pagination.limit < totalCount;

    const result = {
      posts,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: totalCount,
        has_more: hasMore,
      },
    };

    // Log response time
    const duration = Date.now() - startTime;
    console.log(`getFeed (${feedType}): ${duration}ms, ${posts.length} posts`);

    return response.successResponse(result, {
      headers: corsHeaders,
      meta: { 
        duration,
        page: pagination.page,
        limit: pagination.limit,
        total: totalCount,
        hasMore,
      },
    });

  } catch (error) {
    console.error('Unexpected error in getFeed:', error);
    return errors.internalError(
      'An unexpected error occurred',
      Deno.env.get('ENVIRONMENT') === 'development'
    );
  }
});
