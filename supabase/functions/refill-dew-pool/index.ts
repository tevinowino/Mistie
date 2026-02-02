// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// };

// // Categories for variety
// const CATEGORIES = ['gratitude', 'dreams', 'memories', 'growth', 'fun', 'deep', 'future', 'intimacy'];

// /**
//  * Generate prompts using Gemini AI
//  */
// async function generatePromptsWithAI(apiKey: string, count: number): Promise<string[]> {
//   const systemPrompt = `
// Generate exactly ${count} unique, intimate, thought-provoking questions for couples to strengthen their connection.

// Guidelines:
// - Questions should spark meaningful conversation
// - Mix of fun, deep, and reflective topics
// - Maximum 20 words per question
// - Avoid yes/no questions
// - No introductory text, no numbering
// - Output ONLY a valid JSON array of strings

// Categories to cover:
// - Gratitude ("What made you grateful about us this week?")
// - Dreams ("What's a dream you haven't shared with me yet?")
// - Memories ("What's your favorite memory of us from last month?")
// - Growth ("How have we grown together this year?")
// - Fun ("If we could teleport anywhere right now, where would you take us?")
// - Deep ("What's something you've been afraid to tell me?")
// - Future ("Where do you see us in 5 years?")
// - Intimacy ("What makes you feel most loved by me?")

// Example output:
// ["What made you smile about us today?", "What's one thing I do that makes you feel safe?"]
// `;

//   try {
//     const response = await fetch(GEMINI_API_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'x-goog-api-key': apiKey,
//       },
//       body: JSON.stringify({
//         contents: [{ parts: [{ text: systemPrompt }] }],
//         generationConfig: { 
//           temperature: 0.9,
//           maxOutputTokens: 2048,
//         },
//       }),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error(`Gemini API Error (${response.status}):`, errorText);
//       return [];
//     }

//     const data = await response.json();
//     const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

//     // Extract JSON array from response
//     const jsonMatch = text.match(/\[[\s\S]*\]/);
//     if (jsonMatch) {
//       const parsed = JSON.parse(jsonMatch[0]);
//       if (Array.isArray(parsed)) {
//         return parsed.filter((q: unknown) => typeof q === 'string' && q.length > 10);
//       }
//     }

//     console.warn('AI response was not a valid JSON array:', text);
//     return [];
//   } catch (error) {
//     console.error('Error calling Gemini API:', error);
//     return [];
//   }
// }

// /**
//  * Assign a random category to a prompt
//  */
// function getRandomCategory(): string {
//   return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
// }

// // ============================================================================
// // MAIN HANDLER
// // ============================================================================
// Deno.serve(async (req) => {
//   // Handle CORS preflight
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { headers: corsHeaders });
//   }

//   try {
//     const supabase = createClient(
//       Deno.env.get('SUPABASE_URL') ?? '',
//       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
//     );

//     const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
//     if (!GEMINI_API_KEY) {
//       throw new Error('Missing GEMINI_API_KEY environment variable');
//     }

//     // Parse optional parameters
//     let targetCount = 50; // Default: generate 50 prompts
//     let forceRefill = false;

//     try {
//       const body = await req.json();
//       if (body.count) targetCount = Math.min(body.count, 100); // Cap at 100
//       if (body.force) forceRefill = true;
//     } catch {
//       // Body might be empty, use defaults
//     }

//     // 1. Check current pool size
//     const { count: currentCount, error: countError } = await supabase
//       .from('daily_dew_prompts')
//       .select('*', { count: 'exact', head: true });

//     if (countError) throw countError;

//     const poolSize = currentCount || 0;
//     console.log(`[RefillPool] Current pool size: ${poolSize}`);

//     // 2. Skip if pool is healthy (unless forced)
//     if (poolSize >= 100 && !forceRefill) {
//       return new Response(
//         JSON.stringify({ 
//           success: true, 
//           message: 'Pool is healthy, skipping refill',
//           poolSize 
//         }),
//         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
//       );
//     }

//     // 3. Generate new prompts with AI
//     console.log(`[RefillPool] Generating ${targetCount} new prompts...`);
//     const newPrompts = await generatePromptsWithAI(GEMINI_API_KEY, targetCount);

//     if (newPrompts.length === 0) {
//       throw new Error('AI failed to generate any prompts');
//     }

//     console.log(`[RefillPool] AI generated ${newPrompts.length} prompts`);

//     // 4. Insert into pool (with deduplication)
//     const insertData = newPrompts.map((question_text) => ({
//       question_text,
//       category: getRandomCategory(),
//       min_age: 18, // Default to adult
//       dynamic: [], // General prompts, apply to all dynamics
//     }));

//     const { data: inserted, error: insertError } = await supabase
//       .from('daily_dew_prompts')
//       .upsert(insertData, { 
//         onConflict: 'question_text',
//         ignoreDuplicates: true 
//       })
//       .select();

//     if (insertError) {
//       console.error('Insert error:', insertError);
//       throw insertError;
//     }

//     const insertedCount = inserted?.length || 0;
//     console.log(`[RefillPool] Inserted ${insertedCount} new prompts`);

//     // 5. Get updated pool size
//     const { count: newPoolSize } = await supabase
//       .from('daily_dew_prompts')
//       .select('*', { count: 'exact', head: true });

//     return new Response(
//       JSON.stringify({
//         success: true,
//         message: `Pool refilled successfully`,
//         generated: newPrompts.length,
//         inserted: insertedCount,
//         previousPoolSize: poolSize,
//         currentPoolSize: newPoolSize,
//       }),
//       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
//     );

//   } catch (error: unknown) {
//     const message = error instanceof Error ? error.message : 'Unknown error';
//     console.error('[RefillPool] Error:', message);
    
//     return new Response(
//       JSON.stringify({ success: false, error: message }),
//       { 
//         status: 500, 
//         headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
//       }
//     );
//   }
// });
