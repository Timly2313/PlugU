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
      content, 
      media_urls = [], 
      location,
      latitude,
      longitude,
      tags = []
    } = await req.json();

    if (!content || content.length < 1) throw new Error('Content is required');

    const { data: post, error: postError } = await supabaseClient
      .from('posts')
      .insert({
        user_id: user.id,
        content,
        media_urls,
        location,
        coordinates: (latitude && longitude) ? `(${latitude},${longitude})` : null,
        status: 'under_review'
      })
      .select()
      .single();

    if (postError) throw postError;

    // Add tags
    if (tags.length > 0) {
      const tagInserts = tags.map((tagId: string) => ({
        post_id: post.id,
        tag_id: tagId
      }));
      await supabaseClient.from('post_tags').insert(tagInserts);
    }

    // Add to moderation queue
    await supabaseClient.from('moderation_queue').insert({
      content_type: 'post',
      content_id: post.id,
      content_text: content,
      content_media_urls: media_urls,
      user_id: user.id,
      ai_moderation_status: 'pending'
    });

    return new Response(
      JSON.stringify({ success: true, post }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
