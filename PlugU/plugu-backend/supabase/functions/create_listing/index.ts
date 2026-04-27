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

    // Get authenticated user
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const {
      title,
      description,
      price,
      currency = 'ZAR',
      category,
      condition,
      images = [],
      location,      
      latitude,
      longitude,
      tags = [],
      expires_at,
    } = await req.json();

    // Validation
    if (!title || title.length < 3)
      throw new Error('Validation: Title must be at least 3 characters');
    if (!description || description.length < 10)
      throw new Error('Validation: Description must be at least 10 characters');
    if (!category)
      throw new Error('Validation: Category is required');
    if (price !== undefined && price < 0)
      throw new Error('Validation: Price cannot be negative');

    // Insert listing
    const { data: listing, error: listingError } = await supabaseClient
      .from('listings')
      .insert({
        user_id: user.id,
        title,
        description,
        price,
        currency,
        category,
        condition,
        images,
        location: location ?? null,
        coordinates: latitude && longitude ? `(${latitude},${longitude})` : null,
        expires_at: expires_at ?? null,
        status: 'under_review',
      })
      .select()
      .single();

    if (listingError) throw listingError;

    // Add tags
    if (tags.length > 0) {
      const tagInserts = tags.map((tagId: string) => ({
        listing_id: listing.id,
        tag_id: tagId,
      }));
      await supabaseClient.from('listing_tags').insert(tagInserts);
    }

    // Queue for AI moderation
    await supabaseClient.from('moderation_queue').insert({
      content_type: 'listing',
      content_id: listing.id,
      content_text: `${title} ${description}`,
      content_media_urls: images,
      user_id: user.id,
      ai_moderation_status: 'pending',
    });

    return new Response(
      JSON.stringify({ success: true, listing }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
