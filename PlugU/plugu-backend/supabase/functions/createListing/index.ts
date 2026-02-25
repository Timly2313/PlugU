/**
 * PlugU Edge Function: createListing
 * Creates a new marketplace listing with AI moderation
 * 
 * @method POST
 * @body { title, description, price, category, images, location, etc. }
 * @returns { listing }
 */

import { createServiceClient } from '../_shared/db.ts';
import { authMiddleware } from '../_shared/auth.ts';
import { response, errors, handleCORS, parseBody } from '../_shared/response.ts';
import { validate, schemas } from '../_shared/validate.ts';
import { moderateText, moderateImages, flagContent } from '../_shared/moderation.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateListingRequest {
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
    const { data: body, error: parseError } = await parseBody<CreateListingRequest>(req);
    
    if (parseError) return parseError;
    if (!body) return errors.badRequest('Request body is required');

    // Validate input using schema
    const validation = schemas.createListing.validate(body);
    if (!validation.valid) {
      return errors.validationError('Validation failed', {
        errors: validation.errors,
      });
    }

    // Additional validation
    const titleValidation = validate('title', body.title)
      .isRequired()
      .isString()
      .minLength(3)
      .maxLength(255);

    const descriptionValidation = validate('description', body.description)
      .isRequired()
      .isString()
      .minLength(10)
      .maxLength(5000);

    if (!titleValidation.isValid() || !descriptionValidation.isValid()) {
      return errors.validationError('Validation failed', {
        errors: [
          ...titleValidation.getErrors(),
          ...descriptionValidation.getErrors(),
        ],
      });
    }

    // Sanitize inputs
    const sanitizedTitle = body.title
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    const sanitizedDescription = body.description
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // AI Content Moderation
    const titleModeration = await moderateText(sanitizedTitle, {
      contentType: 'listing',
    });

    const descriptionModeration = await moderateText(sanitizedDescription, {
      contentType: 'listing',
    });

    // Block if either moderation fails
    if (titleModeration.action === 'block' || descriptionModeration.action === 'block') {
      return errors.forbidden('Content violates community guidelines');
    }

    // Moderate images if provided
    let imageModerationResults = [];
    if (body.images && body.images.length > 0) {
      imageModerationResults = await moderateImages(body.images, {
        contentType: 'listing',
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

    // Insert listing using RPC
    const { data: listing, error: insertError } = await supabase.rpc('create_listing', {
      p_user_id: user.id,
      p_title: sanitizedTitle,
      p_description: sanitizedDescription,
      p_price: body.price || null,
      p_currency: body.currency || 'USD',
      p_price_type: body.priceType || 'fixed',
      p_category: body.category,
      p_subcategory: body.subcategory || null,
      p_condition: body.condition || null,
      p_images: body.images || [],
      p_image_metadata: {},
      p_location: body.location || null,
      p_coordinates: coordinatesPoint,
      p_is_negotiable: body.isNegotiable || false,
      p_is_shipping_available: body.isShippingAvailable || false,
      p_is_pickup_available: body.isPickupAvailable ?? true,
      p_expires_at: body.expiresAt || null,
      p_tag_ids: body.tagIds || [],
    });

    if (insertError) {
      console.error('Error creating listing:', insertError);
      return errors.internalError('Failed to create listing');
    }

    // Flag listing if moderation detected issues
    const shouldFlag = titleModeration.action === 'flag' || 
                       descriptionModeration.action === 'flag' ||
                       imageModerationResults.some(img => img.action === 'flag');

    if (shouldFlag) {
      const reason = titleModeration.reason || 
                     descriptionModeration.reason || 
                     'image_content_flagged';
      const score = Math.max(
        titleModeration.score, 
        descriptionModeration.score,
        ...imageModerationResults.map(img => img.score)
      );
      
      await flagContent('listing', listing.id, reason, score);
    }

    // Build response
    const result = {
      listing: {
        ...listing,
        moderation: {
          flagged: shouldFlag,
          title_score: titleModeration.score,
          description_score: descriptionModeration.score,
        },
      },
    };

    // Log response time
    const duration = Date.now() - startTime;
    console.log(`createListing: ${duration}ms for user ${user.id}`);

    return response.successResponse(result, {
      headers: { ...headers, ...corsHeaders },
      meta: { duration },
    });

  } catch (error) {
    console.error('Unexpected error in createListing:', error);
    return errors.internalError(
      'An unexpected error occurred',
      Deno.env.get('ENVIRONMENT') === 'development'
    );
  }
});
