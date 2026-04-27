import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';

// ─── Text moderation via OpenAI Moderation API (free, purpose-built) ─────────

async function moderateText(text: string): Promise<{
  approved: boolean;
  score: number;
  reason: string | null;
  categories: Record<string, boolean>;
}> {
  if (!text?.trim()) {
    return { approved: true, score: 0, reason: null, categories: {} };
  }

  const res = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: text }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI Moderation API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const result = data.results[0];

  // Highest category score becomes the overall score
  const scores: Record<string, number> = result.category_scores;
  const topScore = Math.max(...Object.values(scores));
  const flaggedCategories = Object.entries(result.categories)
    .filter(([, flagged]) => flagged)
    .map(([cat]) => cat.replace(/\//g, ' / '));

  return {
    approved: !result.flagged,
    score: parseFloat(topScore.toFixed(4)),
    reason: flaggedCategories.length > 0 ? `Flagged: ${flaggedCategories.join(', ')}` : null,
    categories: result.categories,
  };
}

// ─── Image moderation via GPT-4o Vision ──────────────────────────────────────

async function moderateImages(urls: string[]): Promise<{
  approved: boolean;
  score: number;
  reason: string | null;
}> {
  if (!urls?.length) {
    return { approved: true, score: 0, reason: null };
  }

  const imageMessages = urls.map((url) => ({
    type: 'image_url',
    image_url: { url, detail: 'low' }, // 'low' = cheaper, fast, sufficient for moderation
  }));

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: `You are a content moderation system. Analyze images for policy violations.
Respond ONLY with valid JSON in this exact shape:
{
  "approved": true | false,
  "score": 0.0–1.0,
  "reason": "string or null"
}
score: 0.0 = clearly safe, 1.0 = severe violation.
Flag if any image contains: nudity, sexual content, graphic violence, gore, hate symbols, 
self-harm depictions, or illegal activity. If multiple images, use the worst-case score.`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Moderate these images:' },
            ...imageMessages,
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI Vision API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const raw = data.choices[0].message.content.trim();

  // Strip markdown code fences if present
  const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsed = JSON.parse(jsonStr);

  return {
    approved: Boolean(parsed.approved),
    score: parseFloat(Number(parsed.score).toFixed(4)),
    reason: parsed.reason ?? null,
  };
}

// ─── Edge function handler ────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { record } = await req.json();
    const { id, content_type, content_id, content_text, content_media_urls, user_id } = record;

    // Run text and image moderation in parallel
    const [textResult, imageResult] = await Promise.all([
      moderateText(content_text || ''),
      moderateImages(content_media_urls || []),
    ]);

    const finalApproved = textResult.approved && imageResult.approved;
    const finalScore = Math.max(textResult.score, imageResult.score);
    const finalReason = [textResult.reason, imageResult.reason]
      .filter(Boolean)
      .join('; ') || null;

    const status = finalApproved ? 'approved' : 'rejected';

    // Update moderation queue
    await supabaseClient
      .from('moderation_queue')
      .update({
        ai_moderation_status: status,
        ai_moderation_score: finalScore,
        ai_moderation_result: {
          text_moderation: textResult,
          image_moderation: imageResult,
          timestamp: new Date().toISOString(),
        },
      })
      .eq('id', id);

    // Update the actual content table
    const tableName =
      content_type === 'post' ? 'posts' :
      content_type === 'listing' ? 'listings' :
      content_type === 'comment' ? 'comments' : 'messages';

    await supabaseClient
      .from(tableName)
      .update({
        status: finalApproved ? 'active' : 'hidden',
        is_flagged: !finalApproved,
        flag_reason: finalReason,
        moderation_score: finalScore,
      })
      .eq('id', content_id);

    // Notify user if rejected
    if (!finalApproved) {
      await supabaseClient.from('notifications').insert({
        user_id,
        type: 'moderation',
        title: 'Content Flagged',
        body: `Your ${content_type} was flagged for review. Reason: ${finalReason}`,
        target_type: content_type,
        target_id: content_id,
      });
    }

    return new Response(
      JSON.stringify({ success: true, approved: finalApproved, score: finalScore, reason: finalReason }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Moderation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});