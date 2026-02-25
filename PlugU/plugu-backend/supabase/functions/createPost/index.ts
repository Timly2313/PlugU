/**
 * PlugU Edge Function: createPost
 * Creates a new social media post with AI moderation
 * 
 * @method POST
 * @body { content, mediaUrls, mediaMetadata, location, coordinates, tagIds }
 * @returns { post }
 */

import { createServiceClient } from '../_shared/db.ts';
import { authMiddleware, UserContext } from '../_shared/auth.ts';
import { response, errors, handleCORS, parseBody } from '../_shared/response.ts';
import { validate, schemas } from '../_shared/validate.ts';
import { moderateText, moderateImages, flagContent } from '../_shared/moderation.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePostRequest {
  content: string;
  mediaUrls?: string[];
  mediaMetadata?: Record<string, any>;
  location?: string;
  coordinates?: { lat: number; lng: number };
  tagIds?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  const startTime = Date.now();

  try {
    // Authenticate request
    const { user, error, statusCode, headers } = await authMiddleware(req);
    
    if (error || !user) {
      return errors.unauthorized(error || 'Authentication required');
    }

    // Parse request body
    const { data: body, error: parseError } = await parseBody<CreatePostRequest>(req);
    
    if (parseError) return parseError;
    if (!body) return errors.badRequest('Request body is required');

    // Validate input
    const validation = schemas.createPost.validate(body);
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
      .maxLength(5000);

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
    const textModeration = await moderateText(sanitizedContent, {
      contentType: 'post',
    });

    // Block if text moderation fails
    if (textModeration.action === 'block') {
      return errors.forbidden('Content violates community guidelines');
    }

    // Moderate images if provided
    let imageModerationResults = [];
    if (body.mediaUrls && body.mediaUrls.length > 0) {
      imageModerationResults = await moderateImages(body.mediaUrls, {
        contentType: 'post',
      });

      // Block if any image fails moderation
      const blockedImages = imageModerationResults.filter(img => img.action === 'block');
      if (blockedImages.length > 0) {
        return errors.forbidden('One or more images violate community guidelines');
      }
    }

    // Create Supabase client
    const supabase = createServiceClient();

    // Convert coordinates to PostgreSQL point format if provided
    let coordinatesPoint = null;
    if (body.coordinates) {
      const { lat, lng } = body.coordinates;
      coordinatesPoint = `(${lng},${lat})`;
    }

    // Insert post using RPC for transaction safety
    const { data: post, error: insertError } = await supabase.rpc('create_post', {
      p_user_id: user.id,
      p_content: sanitizedContent,
      p_media_urls: body.mediaUrls || [],
      p_media_metadata: body.mediaMetadata || {},
      p_location: body.location || null,
      p_coordinates: coordinatesPoint,
      p_tag_ids: body.tagIds || [],
    });

    if (insertError) {
      console.error('Error creating post:', insertError);
      return errors.internalError('Failed to create post');
    }

    // Flag post if moderation detected issues
    if (textModeration.action === 'flag' || imageModerationResults.some(img => img.action === 'flag')) {
      await flagContent(
        'post',
        post.id,
        textModeration.reason || 'image_content_flagged',
        textModeration.score
      );
    }

    // Build response
    const result = {
      post: {
        ...post,
        moderation: {
          flagged: textModeration.action === 'flag',
          score: textModeration.score,
        },
      },
    };

    // Log response time
    const duration = Date.now() - startTime;
    console.log(`createPost: ${duration}ms for user ${user.id}`);

    return response.successResponse(result, {
      headers: { ...headers, ...corsHeaders },
      meta: { duration },
    });

  } catch (error) {
    console.error('Unexpected error in createPost:', error);
    return errors.internalError(
      'An unexpected error occurred',
      Deno.env.get('ENVIRONMENT') === 'development'
    );
  }
});
