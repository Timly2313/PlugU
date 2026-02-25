/**
 * PlugU Edge Function: sendMessage
 * Sends a message in a conversation with AI moderation
 * 
 * @method POST
 * @body { conversationId, content, mediaUrls, replyToId }
 * @returns { message }
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

interface SendMessageRequest {
  conversationId: string;
  content: string;
  mediaUrls?: string[];
  replyToId?: string;
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
    const { data: body, error: parseError } = await parseBody<SendMessageRequest>(req);
    
    if (parseError) return parseError;
    if (!body) return errors.badRequest('Request body is required');

    // Validate input using schema
    const validation = schemas.createMessage.validate(body);
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
      .maxLength(4000);

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
      contentType: 'message',
    });

    // Block if moderation fails
    if (moderation.action === 'block') {
      return errors.forbidden('Message violates community guidelines');
    }

    // Moderate images if provided
    let imageModerationResults = [];
    if (body.mediaUrls && body.mediaUrls.length > 0) {
      imageModerationResults = await moderateImages(body.mediaUrls, {
        contentType: 'message',
      });

      // Block if any image fails moderation
      const blockedImages = imageModerationResults.filter(img => img.action === 'block');
      if (blockedImages.length > 0) {
        return errors.forbidden('One or more images violate community guidelines');
      }
    }

    // Create Supabase client
    const supabase = createServiceClient();

    // Verify user is participant in conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('id, unread_count')
      .eq('conversation_id', body.conversationId)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      return errors.forbidden('You are not a participant in this conversation');
    }

    // Verify replyTo message exists if provided
    if (body.replyToId) {
      const { data: replyMsg, error: replyError } = await supabase
        .from('messages')
        .select('id')
        .eq('id', body.replyToId)
        .eq('conversation_id', body.conversationId)
        .single();

      if (replyError || !replyMsg) {
        return errors.notFound('Reply message not found in this conversation');
      }
    }

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: body.conversationId,
        sender_id: user.id,
        content: sanitizedContent,
        media_urls: body.mediaUrls || [],
        reply_to_id: body.replyToId || null,
        status: 'sent',
      })
      .select(`
        *,
        sender:sender_id (username, display_name, avatar_url)
      `)
      .single();

    if (insertError) {
      console.error('Error sending message:', insertError);
      return errors.internalError('Failed to send message');
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', body.conversationId);

    // Increment unread count for other participants
    await supabase
      .from('conversation_participants')
      .update({ 
        unread_count: supabase.rpc('increment', { x: 1 })
      })
      .eq('conversation_id', body.conversationId)
      .neq('user_id', user.id);

    // Get other participants for notifications
    const { data: otherParticipants } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', body.conversationId)
      .neq('user_id', user.id);

    // Create notifications for other participants
    if (otherParticipants && otherParticipants.length > 0) {
      const notifications = otherParticipants.map(p => ({
        user_id: p.user_id,
        type: 'new_message',
        title: 'New Message',
        body: `You have a new message`,
        actor_id: user.id,
        target_type: 'conversation',
        target_id: body.conversationId,
        data: {
          conversation_id: body.conversationId,
          message_id: message.id,
        },
      }));

      await supabase.from('notifications').insert(notifications);
    }

    // Flag message if moderation detected issues
    if (moderation.action === 'flag' || imageModerationResults.some(img => img.action === 'flag')) {
      await flagContent(
        'message',
        message.id,
        moderation.reason || 'image_content_flagged',
        moderation.score
      );
    }

    // Build response
    const result = {
      message: {
        ...message,
        moderation: {
          flagged: moderation.action === 'flag',
          score: moderation.score,
        },
      },
    };

    // Log response time
    const duration = Date.now() - startTime;
    console.log(`sendMessage: ${duration}ms, user ${user.id}, conversation ${body.conversationId}`);

    return response.successResponse(result, {
      headers: { ...headers, ...corsHeaders },
      meta: { duration },
    });

  } catch (error) {
    console.error('Unexpected error in sendMessage:', error);
    return errors.internalError(
      'An unexpected error occurred',
      Deno.env.get('ENVIRONMENT') === 'development'
    );
  }
});
