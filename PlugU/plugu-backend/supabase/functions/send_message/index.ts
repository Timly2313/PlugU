import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { 
      conversation_id, 
      content, 
      media_urls = [], 
      reply_to_id,
      recipient_id // For creating new conversation
    } = await req.json();

    if (!content || content.length < 1) throw new Error('Content is required');

    let finalConversationId = conversation_id;

    // Create new conversation if no conversation_id provided
    if (!finalConversationId && recipient_id) {
      const { data: newConv, error: convError } = await supabaseClient.rpc('create_conversation', {
        p_user_ids: [user.id, recipient_id],
        p_type: 'direct'
      });

      if (convError) throw convError;
      finalConversationId = newConv;
    }

    if (!finalConversationId) throw new Error('conversation_id or recipient_id is required');

    // Send message using RPC
    const { data: messageId, error } = await supabaseClient.rpc('send_message', {
      p_conversation_id: finalConversationId,
      p_sender_id: user.id,
      p_content: content,
      p_media_urls: media_urls,
      p_reply_to_id: reply_to_id || null
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, message_id: messageId, conversation_id: finalConversationId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
