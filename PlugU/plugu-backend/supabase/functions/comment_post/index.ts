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

    const { post_id, content, parent_id } = await req.json();
    if (!post_id) throw new Error('post_id is required');
    if (!content || content.length < 1) throw new Error('Content is required');

    const { data: comment, error } = await supabaseClient
      .from('comments')
      .insert({
        post_id,
        user_id: user.id,
        parent_id,
        content,
        status: 'under_review'
      })
      .select()
      .single();

    if (error) throw error;

    // Add to moderation queue
    await supabaseClient.from('moderation_queue').insert({
      content_type: 'comment',
      content_id: comment.id,
      content_text: content,
      user_id: user.id,
      ai_moderation_status: 'pending'
    });

    // Notify post owner
    const { data: post } = await supabaseClient
      .from('posts')
      .select('user_id')
      .eq('id', post_id)
      .single();

    if (post && post.user_id !== user.id) {
      await supabaseClient.from('notifications').insert({
        user_id: post.user_id,
        type: 'comment',
        title: 'New Comment',
        body: content.substring(0, 100),
        actor_id: user.id,
        target_type: 'post',
        target_id: post_id,
        data: { comment_id: comment.id }
      });
    }

    // Notify parent comment owner if reply
    if (parent_id) {
      const { data: parentComment } = await supabaseClient
        .from('comments')
        .select('user_id')
        .eq('id', parent_id)
        .single();

      if (parentComment && parentComment.user_id !== user.id) {
        await supabaseClient.from('notifications').insert({
          user_id: parentComment.user_id,
          type: 'reply',
          title: 'New Reply',
          body: content.substring(0, 100),
          actor_id: user.id,
          target_type: 'comment',
          target_id: parent_id,
          data: { comment_id: comment.id }
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, comment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
