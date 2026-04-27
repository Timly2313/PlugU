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

    const { notification_ids, mark_all = false } = await req.json();

    if (mark_all) {
      const { data: count, error } = await supabaseClient.rpc('mark_all_notifications_read', {
        p_user_id: user.id
      });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, marked_count: count }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!notification_ids || !Array.isArray(notification_ids)) {
      throw new Error('notification_ids array is required');
    }

    const { error } = await supabaseClient
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', notification_ids)
      .eq('user_id', user.id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, marked_count: notification_ids.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
