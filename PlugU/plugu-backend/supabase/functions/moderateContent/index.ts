/**
 * PlugU Edge Function: moderateContent
 * AI-powered content moderation endpoint
 * Supports text, image, email, and phone validation
 * 
 * @method POST
 * @body { type, content, imageUrl, email, phone }
 * @returns { moderation result }
 */

import { createServiceClient } from '../_shared/db.ts';
import { authMiddleware, Permissions } from '../_shared/auth.ts';
import { response, errors, handleCORS, parseBody } from '../_shared/response.ts';
import { validate } from '../_shared/validate.ts';
import { 
  moderateText, 
  moderateImage, 
  validateEmail, 
  validatePhone,
  flagContent,
  approveContent,
  type ContentType 
} from '../_shared/moderation.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerateContentRequest {
  action?: 'check' | 'flag' | 'approve';
  type?: 'text' | 'image' | 'email' | 'phone' | 'content';
  // For text moderation
  content?: string;
  contentType?: ContentType;
  // For image moderation
  imageUrl?: string;
  imageUrls?: string[];
  // For email validation
  email?: string;
  // For phone validation
  phone?: string;
  // For flag/approve actions
  targetType?: ContentType;
  targetId?: string;
  reason?: string;
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
    const { data: body, error: parseError } = await parseBody<ModerateContentRequest>(req);
    
    if (parseError) return parseError;
    if (!body) return errors.badRequest('Request body is required');

    const action = body.action || 'check';
    const type = body.type || 'text';

    // Create Supabase client
    const supabase = createServiceClient();

    // Handle flag/approve actions (require moderator permissions)
    if (action === 'flag' || action === 'approve') {
      // Check moderator permissions
      const userProfile = await supabase
        .from('profiles')
        .select('is_verified')
        .eq('id', user.id)
        .single();

      const isModerator = userProfile.data?.is_verified || false;
      
      if (!isModerator) {
        return errors.forbidden('Moderator permissions required');
      }

      // Validate required fields
      if (!body.targetType || !body.targetId) {
        return errors.badRequest('targetType and targetId are required for flag/approve actions');
      }

      if (action === 'flag') {
        await flagContent(
          body.targetType,
          body.targetId,
          body.reason || 'manual_review',
          1.0
        );

        return response.successResponse({
          action: 'flagged',
          targetType: body.targetType,
          targetId: body.targetId,
        }, {
          headers: { ...headers, ...corsHeaders },
        });
      }

      if (action === 'approve') {
        await approveContent(body.targetType, body.targetId);

        return response.successResponse({
          action: 'approved',
          targetType: body.targetType,
          targetId: body.targetId,
        }, {
          headers: { ...headers, ...corsHeaders },
        });
      }
    }

    // Handle check action
    let result: any;

    switch (type) {
      case 'text':
        if (!body.content) {
          return errors.badRequest('content is required for text moderation');
        }

        const textValidation = validate('content', body.content)
          .isRequired()
          .isString()
          .maxLength(10000);

        if (!textValidation.isValid()) {
          return errors.validationError('Invalid content', {
            errors: textValidation.getErrors(),
          });
        }

        result = await moderateText(body.content, {
          contentType: body.contentType || 'post',
        });
        break;

      case 'image':
        if (!body.imageUrl && (!body.imageUrls || body.imageUrls.length === 0)) {
          return errors.badRequest('imageUrl or imageUrls is required for image moderation');
        }

        if (body.imageUrls && body.imageUrls.length > 0) {
          // Batch moderate multiple images
          const imageResults = await Promise.all(
            body.imageUrls.map(url => moderateImage(url, {
              contentType: body.contentType || 'post',
            }))
          );

          result = {
            images: imageResults,
            flagged: imageResults.some(r => r.flagged),
            highestScore: Math.max(...imageResults.map(r => r.score)),
          };
        } else {
          result = await moderateImage(body.imageUrl!, {
            contentType: body.contentType || 'post',
          });
        }
        break;

      case 'email':
        if (!body.email) {
          return errors.badRequest('email is required for email validation');
        }

        const emailValidation = validate('email', body.email).isEmail();
        if (!emailValidation.isValid()) {
          return errors.validationError('Invalid email format');
        }

        result = await validateEmail(body.email);
        break;

      case 'phone':
        if (!body.phone) {
          return errors.badRequest('phone is required for phone validation');
        }

        result = await validatePhone(body.phone);
        break;

      case 'content':
        // Moderate both text and images
        if (!body.content && !body.imageUrls) {
          return errors.badRequest('content or imageUrls is required for content moderation');
        }

        const contentResult: any = {};

        if (body.content) {
          contentResult.text = await moderateText(body.content, {
            contentType: body.contentType || 'post',
          });
        }

        if (body.imageUrls && body.imageUrls.length > 0) {
          contentResult.images = await Promise.all(
            body.imageUrls.map(url => moderateImage(url, {
              contentType: body.contentType || 'post',
            }))
          );
        }

        contentResult.flagged = 
          contentResult.text?.flagged || 
          contentResult.images?.some((r: any) => r.flagged);

        contentResult.action = contentResult.flagged ? 'flag' : 'allow';

        result = contentResult;
        break;

      default:
        return errors.badRequest(`Invalid moderation type: ${type}`);
    }

    // Log response time
    const duration = Date.now() - startTime;
    console.log(`moderateContent (${type}): ${duration}ms`);

    return response.successResponse({
      type,
      result,
    }, {
      headers: { ...headers, ...corsHeaders },
      meta: { duration },
    });

  } catch (error) {
    console.error('Unexpected error in moderateContent:', error);
    return errors.internalError(
      'An unexpected error occurred',
      Deno.env.get('ENVIRONMENT') === 'development'
    );
  }
});
