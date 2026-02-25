/**
 * PlugU Edge Function: commentPost
 * Adds a comment to a post with AI moderation
 * 
 * @method POST
 * @body { postId, content, parentId }
 * @returns { comment }
 */

import { createServiceClient } from '../_shared/db.ts';
import { authMiddleware } from '../_shared/auth.ts';
import { response, errors, handleCORS, parseBody } from '../_shared/response.ts';
import { validate, schemas } from '../_shared/validate.ts';
import { moderateText, flagContent } from '../_shared/moderation.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommentPostRequest {
  postId: string;
  content: string;
  parentId?: string;
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
    const { data: body, error: parseError } = await parseBody<CommentPostRequest>(req);
    
    if (parseError) return parseError;
    if (!body) return errors.badRequest('Request body is required');

    // Validate input using schema
    const validation = schemas.createComment.validate(body);
    if (!validation.valid) {
      return errors.validationError('Validation failed', {
        errors: validation.errors,
      });
    }

    // Additional validation
    const contentValidation = validate('content', body.content)
      .isRequired()
      .isString()
      .minLength(1)
      .maxLength(2000);

    if (!contentValidation.isValid()) {
      return errors.validationError('Content validation failed', {
        errors: contentValidation.getErrors(),
      });
    }

    // Sanitize content
    const sanitizedContent = body.content
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // AI Content Moderation
    const moderation = await moderateText(sanitizedContent, {
      contentType: 'comment',
    });

    // Block if moderation fails
    if (moderation.action === 'block') {
      return errors.forbidden('Content violates community guidelines');
    }

    // Create Supabase client
    const supabase = createServiceClient();

    // Verify post exists and is active
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, user_id, status')
      .eq('id', body.postId)
      .single();

    if (postError || !post) {
      return errors.notFound('Post not found');
    }

    if (post.status !== 'active') {
      return errors.forbidden('Cannot comment on this post');
    }

    // Verify parent comment exists if provided
    if (body.parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id')
        .eq('id', body.parentId)
        .eq('post_id', body.postId)
        .eq('status', 'active')
        .single();

      if (parentError || !parentComment) {
        return errors.notFound('Parent comment not found');
      }
    }

    // Insert comment using RPC
    const { data: comment, error: insertError } = await supabase.rpc('comment_on_post', {
      p_user_id: user.id,
      p_post_id: body.postId,
      p_content: sanitizedContent,
      p_parent_id: body.parentId || null,
    });

    if (insertError) {
      console.error('Error creating comment:', insertError);
      return errors.internalError('Failed to create comment');
    }

    // Flag comment if moderation detected issues
    if (moderation.action === 'flag') {
      await flagContent(
        'comment',
        comment.id,
        moderation.reason || 'content_flagged',
        moderation.score
      );
    }

    // Build response
    const result = {
      comment: {
        ...comment,
        moderation: {
          flagged: moderation.action === 'flag',
          score: moderation.score,
        },
      },
    };

    // Log response time
    const duration = Date.now() - startTime;
    console.log(`commentPost: ${duration}ms, user ${user.id}, post ${body.postId}`);

    return response.successResponse(result, {
      headers: { ...headers, ...corsHeaders },
      meta: { duration },
    });

  } catch (error) {
    console.error('Unexpected error in commentPost:', error);
    return errors.internalError(
      'An unexpected error occurred',
      Deno.env.get('ENVIRONMENT') === 'development'
    );
  }
});
