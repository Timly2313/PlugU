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

    const { post_id, action } = await req.json();
    if (!post_id) throw new Error('post_id is required');

    if (action === 'unlike') {
      const { error } = await supabaseClient
        .from('post_likes')
        .delete()
        .eq('post_id', post_id)
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, liked: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Like post
    const { error } = await supabaseClient
      .from('post_likes')
      .insert({ post_id, user_id: user.id })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({ success: true, liked: true, message: 'Already liked' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    // Create notification for post owner
    const { data: post } = await supabaseClient
      .from('posts')
      .select('user_id')
      .eq('id', post_id)
      .single();

    if (post && post.user_id !== user.id) {
      await supabaseClient.from('notifications').insert({
        user_id: post.user_id,
        type: 'like',
        title: 'New Like',
        body: 'Someone liked your post',
        actor_id: user.id,
        target_type: 'post',
        target_id: post_id
      });
    }

    return new Response(
      JSON.stringify({ success: true, liked: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
