import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to process a single bond
async function processBond(supabase: any, bondId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 0. Check if Dew already exists for today
    const { data: existingDew } = await supabase
      .from('daily_dews')
      .select('question_text')
      .eq('bond_id', bondId)
      .eq('scheduled_for', today)
      .maybeSingle();

    if (existingDew) {
      return { 
        bondId, 
        success: true, 
        message: 'Already exists', 
        question: existingDew.question_text 
      };
    }

    // 1. Fetch Anchors for context
    const { data: anchors } = await supabase
      .from('relationship_anchors')
      .select('key, value')
      .eq('bond_id', bondId);

    const anchorText = anchors && anchors.length > 0
      ? anchors.map((a: any) => `${a.key}: ${a.value}`).join(', ')
      : "None";

    // 2. Call Gemini API
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    const prompt = `
      You are Mistie, a relationship companion. 
      Context (Anchors): [${anchorText}]
      Task: Generate exactly one intimate, thought-provoking question for this couple to answer.
      Constraints: 
      - Maximum 15 words.
      - No introductory text (e.g. "Here is a question").
      - No fluff.
      - Output ONLY the question.
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY ?? ''
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const question = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!question) throw new Error("Failed to generate question from Gemini");

    // 3. Insert into Database
    const { error: insertError } = await supabase
      .from('daily_dews')
      .insert({
        bond_id: bondId,
        question_text: question,
        scheduled_for: today,
      });

    if (insertError) throw insertError;

    return { bondId, success: true, question };
  } catch (err: any) {
    console.error(`Error processing bond ${bondId}:`, err);
    return { bondId, success: false, error: err.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let bond_id;
    try {
      const body = await req.json();
      bond_id = body.bond_id;
    } catch {
      // Body might be empty if triggering for all
    }

    const results = [];

    if (bond_id) {
      // Single Mode
      const result = await processBond(supabase, bond_id);
      results.push(result);
    } else {
      // Batch Mode: Fetch all active bonds
      const { data: bonds, error: bondsError } = await supabase
        .from('bonds')
        .select('id')
        .eq('is_active', true)
        .eq('status', 'couple'); // Only active couples

      if (bondsError) throw bondsError;

      // Process in parallel (or limit concurrency if needed for rate limits)
      const bondPromises = bonds.map((b: any) => processBond(supabase, b.id));
      const batchResults = await Promise.all(bondPromises);
      results.push(...batchResults);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
