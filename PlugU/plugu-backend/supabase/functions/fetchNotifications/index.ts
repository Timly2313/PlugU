/**
 * PlugU Edge Function: fetchNotifications
 * Retrieves notifications for the authenticated user
 * 
 * @method GET
 * @query { unreadOnly, page, limit, markRead }
 * @returns { notifications, pagination, unreadCount }
 */

import { createServiceClient } from '../_shared/db.ts';
import { authMiddleware } from '../_shared/auth.ts';
import { response, errors, handleCORS, parseQueryParams, parsePagination } from '../_shared/response.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationsQueryParams {
  unreadOnly?: string;
  page?: string;
  limit?: string;
  markRead?: string;
  notificationIds?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  const startTime = Date.now();

  try {
    // Authenticate request
    const { user, error, headers } = await authMiddleware(req);
    
    if (error || !user) {
      return errors.unauthorized(error || 'Authentication required');
    }

    // Parse query parameters
    const params = parseQueryParams(req) as NotificationsQueryParams;
    const pagination = parsePagination(params);
    const unreadOnly = params.unreadOnly === 'true';
    const markRead = params.markRead === 'true';

    // Parse notification IDs if provided
    let notificationIds: string[] | undefined;
    if (params.notificationIds) {
      try {
        notificationIds = JSON.parse(params.notificationIds);
        if (!Array.isArray(notificationIds)) {
          notificationIds = [params.notificationIds];
        }
      } catch {
        notificationIds = [params.notificationIds];
      }
    }

    // Create Supabase client
    const supabase = createServiceClient();

    // Build query
    let query = supabase
      .from('notifications')
      .select(`
        *,
        actor:actor_id (id, username, display_name, avatar_url)
      `, { count: 'exact' })
      .eq('user_id', user.id);

    // Apply unread filter
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(
        (pagination.page - 1) * pagination.limit,
        pagination.page * pagination.limit - 1
      );

    // Execute query
    const { data: notifications, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      return errors.internalError('Failed to fetch notifications');
    }

    // Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (countError) {
      console.error('Error counting unread notifications:', countError);
    }

    // Mark notifications as read if requested
    if (markRead) {
      let updateQuery = supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      // If specific IDs provided, only mark those
      if (notificationIds && notificationIds.length > 0) {
        updateQuery = updateQuery.in('id', notificationIds);
      }

      const { error: updateError } = await updateQuery;

      if (updateError) {
        console.error('Error marking notifications as read:', updateError);
      }
    }

    // Get total count
    const totalCount = count || 0;

    // Build response
    const hasMore = pagination.page * pagination.limit < totalCount;

    const result = {
      notifications: notifications || [],
      unread_count: unreadCount || 0,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: totalCount,
        has_more: hasMore,
      },
    };

    // Log response time
    const duration = Date.now() - startTime;
    console.log(`fetchNotifications: ${duration}ms, user ${user.id}, ${notifications?.length || 0} notifications`);

    return response.successResponse(result, {
      headers: { ...headers, ...corsHeaders },
      meta: {
        duration,
        page: pagination.page,
        limit: pagination.limit,
        total: totalCount,
        hasMore,
      },
    });

  } catch (error) {
    console.error('Unexpected error in fetchNotifications:', error);
    return errors.internalError(
      'An unexpected error occurred',
      Deno.env.get('ENVIRONMENT') === 'development'
    );
  }
});
