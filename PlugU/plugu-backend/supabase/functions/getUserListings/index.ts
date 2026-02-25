/**
 * PlugU Edge Function: getUserListings
 * Retrieves listings for a specific user with filters and pagination
 *
 * @method GET
 * @query { userId, status, page, limit, search, category, minPrice, maxPrice, lat, lng, radiusKm, sort }
 * @returns { listings, pagination }
 */

import { createServiceClient } from '../_shared/db.ts';
import { authMiddleware, optionalAuth } from '../_shared/auth.ts';
import { response, errors, handleCORS, parseQueryParams, parsePagination } from '../_shared/response.ts';
import { validate } from '../_shared/validate.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserListingsQueryParams {
  userId?: string;
  status?: string;
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  lat?: string;
  lng?: string;
  radiusKm?: string;
  sort?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  const startTime = Date.now();

  try {
    // Parse query parameters
    const params = parseQueryParams(req) as UserListingsQueryParams;
    const pagination = parsePagination(params);

    // Get current user (optional)
    const currentUser = await optionalAuth(req);

    // Validate userId
    let targetUserId = params.userId;
    if (!targetUserId) {
      if (!currentUser) return errors.unauthorized('Authentication required or provide userId');
      targetUserId = currentUser.id;
    } else {
      const userIdValidation = validate('userId', targetUserId).isUUID();
      if (!userIdValidation.isValid()) return errors.validationError('Invalid userId');
    }

    // Filters
    const statusFilter = params.status;
    const search = params.search?.trim();
    const category = params.category;
    const minPrice = params.minPrice ? Number(params.minPrice) : null;
    const maxPrice = params.maxPrice ? Number(params.maxPrice) : null;
    const lat = params.lat ? Number(params.lat) : null;
    const lng = params.lng ? Number(params.lng) : null;
    const radiusKm = params.radiusKm ? Number(params.radiusKm) : null;
    const sort = params.sort || 'newest';

    const validStatuses = ['active', 'reserved', 'sold', 'hidden', 'deleted', 'under_review'];
    if (statusFilter && !validStatuses.includes(statusFilter)) {
      return errors.validationError('Invalid status', { validStatuses });
    }

    const supabase = createServiceClient();

    const isOwnListings = currentUser?.id === targetUserId;

    // Build query
    let query = supabase
      .from('listings')
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url, is_verified, reputation_score)
      `, { count: 'exact' })
      .eq('user_id', targetUserId);

    // Status filter
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    } else if (!isOwnListings) {
      query = query.in('status', ['active', 'reserved', 'sold']);
    }

    // Search filter
    if (search) query = query.ilike('title', `%${search}%`);

    // Category filter
    if (category) query = query.eq('category', category);

    // Price range filter
    if (minPrice !== null) query = query.gte('price', minPrice);
    if (maxPrice !== null) query = query.lte('price', maxPrice);

    // Radius filter (requires latitude & longitude columns)
    if (lat && lng && radiusKm) {
      query = query.filter(
        `(
          6371 * acos(
            cos(radians(${lat})) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians(${lng})) +
            sin(radians(${lat})) *
            sin(radians(latitude))
          )
        )`,
        'lte',
        radiusKm
      );
    }

    // Sorting
    if (sort === 'price_low') query = query.order('price', { ascending: true });
    else if (sort === 'price_high') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    // Pagination
    query = query.range(
      (pagination.page - 1) * pagination.limit,
      pagination.page * pagination.limit - 1
    );

    // Execute query
    const { data: listings, error, count } = await query;
    if (error) {
      console.error('Error fetching listings:', error);
      return errors.internalError('Failed to fetch listings');
    }

    const totalCount = count || 0;
    const hasMore = pagination.page * pagination.limit < totalCount;

    const result = {
      listings: listings || [],
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: totalCount,
        has_more: hasMore,
      },
    };

    const duration = Date.now() - startTime;
    console.log(`getUserListings: ${duration}ms, user ${targetUserId}, ${listings?.length || 0} listings`);

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
    console.error('Unexpected error in getUserListings:', error);
    return errors.internalError('An unexpected error occurred', Deno.env.get('ENVIRONMENT') === 'development');
  }
});