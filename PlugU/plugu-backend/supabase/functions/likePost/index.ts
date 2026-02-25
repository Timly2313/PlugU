/**
 * PlugU Edge Function: likePost
 * Toggles like status on a post
 * 
 * @method POST
 * @body { postId }
 * @returns { liked, postId, likeCount }
 */

import { createServiceClient } from '../_shared/db.ts';
import { authMiddleware } from '../_shared/auth.ts';
import { response, errors, handleCORS, parseBody } from '../_shared/response.ts';
import { validate } from '../_shared/validate.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LikePostRequest {
  postId: string;
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

    // Parse request body
    const { data: body, error: parseError } = await parseBody<LikePostRequest>(req);
    
    if (parseError) return parseError;
    if (!body) return errors.badRequest('Request body is required');

    // Validate input
    const postIdValidation = validate('postId', body.postId)
      .isRequired()
      .isUUID();

    if (!postIdValidation.isValid()) {
      return errors.validationError('Invalid postId', {
        errors: postIdValidation.getErrors(),
      });
    }

    // Create Supabase client
    const supabase = createServiceClient();

    // Use RPC for atomic like/unlike operation
    const { data: result, error: rpcError } = await supabase.rpc('like_post', {
      p_user_id: user.id,
      p_post_id: body.postId,
    });

    if (rpcError) {
      console.error('Error toggling like:', rpcError);
      return errors.internalError('Failed to process like');
    }

    // Get updated like count
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', body.postId)
      .single();

    if (postError) {
      console.error('Error fetching post like count:', postError);
    }

    // Build response
    const responseData = {
      liked: result?.liked || false,
      post_id: body.postId,
      like_count: post?.like_count || 0,
    };

    // Log response time
    const duration = Date.now() - startTime;
    console.log(`likePost: ${duration}ms, user ${user.id}, post ${body.postId}, liked: ${responseData.liked}`);

    return response.successResponse(responseData, {
      headers: { ...headers, ...corsHeaders },
      meta: { duration },
    });

  } catch (error) {
    console.error('Unexpected error in likePost:', error);
    return errors.internalError(
      'An unexpected error occurred',
      Deno.env.get('ENVIRONMENT') === 'development'
    );
  }
});
