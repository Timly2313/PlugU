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

    const { 
      query, 
      category, 
      min_price, 
      max_price, 
      latitude, 
      longitude, 
      radius_km = 10,
      limit = 20,
      offset = 0 
    } = await req.json();

    const { data, error } = await supabaseClient.rpc('search_listings', {
      p_query: query || null,
      p_category: category || null,
      p_min_price: min_price || null,
      p_max_price: max_price || null,
      p_status: 'active',
      p_latitude: latitude || null,
      p_longitude: longitude || null,
      p_radius_km: radius_km,
      p_limit: limit,
      p_offset: offset
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ listings: data, count: data?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
