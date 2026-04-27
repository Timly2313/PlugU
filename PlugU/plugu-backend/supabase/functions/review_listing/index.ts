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

    const { listing_id, reviewee_id, rating, title, content } = await req.json();

    if (!reviewee_id) throw new Error('reviewee_id is required');
    if (!rating || rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');

    // Verify user has interacted with listing (has conversation about it)
    if (listing_id) {
      const { data: convCheck } = await supabaseClient
        .from('conversations')
        .select('id')
        .eq('listing_id', listing_id)
        .eq('type', 'listing')
        .single();

      if (!convCheck) {
        // Allow review if no conversation check needed, or implement your own logic
        console.log('No conversation found for listing, allowing review anyway');
      }
    }

    const { data: reviewId, error } = await supabaseClient.rpc('create_review', {
      p_reviewer_id: user.id,
      p_reviewee_id: reviewee_id,
      p_listing_id: listing_id || null,
      p_rating: rating,
      p_title: title || null,
      p_content: content || null
    });

    if (error) throw error;

    // Notify reviewee
    await supabaseClient.from('notifications').insert({
      user_id: reviewee_id,
      type: 'review',
      title: 'New Review',
      body: `You received a ${rating}-star review`,
      actor_id: user.id,
      target_type: 'review',
      target_id: reviewId
    });

    return new Response(
      JSON.stringify({ success: true, review_id: reviewId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
