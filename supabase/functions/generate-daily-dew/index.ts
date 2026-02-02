// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// };

// // Fallback questions if pool is completely empty
// const FALLBACK_QUESTIONS = [
//   "What is one thing you hope to discover about each other today?",
//   "What made you smile thinking about us this week?",
//   "If we could relive one day together, which would you choose?",
//   "What's something small I did recently that meant a lot to you?",
//   "What adventure should we plan for our next free day?",
// ];

// /**
//  * Process a single bond: assign today's dew from the pool
//  */
// async function processBond(
//   supabase: ReturnType<typeof createClient>,
//   bondId: string,
//   today: string
// ): Promise<{ bondId: string; success: boolean; question?: string; error?: string }> {
//   try {
//     // 1. Check if dew already exists for today
//     const { data: existingDew } = await supabase
//       .from('daily_dews')
//       .select('id, question_text')
//       .eq('bond_id', bondId)
//       .eq('scheduled_for', today)
//       .maybeSingle();

//     if (existingDew) {
//       return { 
//         bondId, 
//         success: true, 
//         question: existingDew.question_text,
//       };
//     }

//     // 2. Get prompts this bond has already seen
//     const { data: seenData } = await supabase
//       .from('bond_seen_prompts')
//       .select('prompt_id')
//       .eq('bond_id', bondId)
//       .eq('type', 'dew');

//     const seenIds = seenData?.map((s) => s.prompt_id) || [];

//     // 3. Query pool for unseen prompts
//     let query = supabase
//       .from('daily_dew_prompts')
//       .select('id, question_text')
//       .order('created_at', { ascending: true }) // Oldest first (FIFO)
//       .limit(10);

//     // Exclude seen prompts
//     if (seenIds.length > 0) {
//       query = query.not('id', 'in', `(${seenIds.join(',')})`);
//     }

//     const { data: candidates, error: queryError } = await query;

//     if (queryError) {
//       console.error(`[${bondId}] Query error:`, queryError);
//       throw queryError;
//     }

//     let selectedPrompt: { id: string | null; question_text: string };

//     if (candidates && candidates.length > 0) {
//       // Random selection from available candidates
//       selectedPrompt = candidates[Math.floor(Math.random() * candidates.length)];
//     } else {
//       // Pool exhausted for this couple - use fallback
//       console.warn(`[${bondId}] Pool exhausted, using fallback`);
//       const fallbackQuestion = FALLBACK_QUESTIONS[
//         Math.floor(Math.random() * FALLBACK_QUESTIONS.length)
//       ];
//       selectedPrompt = { id: null, question_text: fallbackQuestion };
//     }

//     // 4. Insert today's dew
//     const { error: insertError } = await supabase
//       .from('daily_dews')
//       .insert({
//         bond_id: bondId,
//         question_text: selectedPrompt.question_text,
//         scheduled_for: today,
//         is_revealed: false,
//       });

//     if (insertError) {
//       console.error(`[${bondId}] Insert error:`, insertError);
//       throw insertError;
//     }

//     // 5. Mark prompt as seen (if from pool)
//     if (selectedPrompt.id) {
//       await supabase.from('bond_seen_prompts').insert({
//         bond_id: bondId,
//         prompt_id: selectedPrompt.id,
//         type: 'dew',
//       });
//     }

//     return { 
//       bondId, 
//       success: true, 
//       question: selectedPrompt.question_text 
//     };

//   } catch (error: unknown) {
//     const message = error instanceof Error ? error.message : 'Unknown error';
//     console.error(`[${bondId}] Error:`, message);
//     return { bondId, success: false, error: message };
//   }
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

//     // Get today's date in UTC
//     const today = new Date().toISOString().split('T')[0];
//     console.log(`[GenerateDailyDew] Running for date: ${today}`);

//     // Parse optional bond_id for single-bond mode
//     let singleBondId: string | null = null;
//     try {
//       const body = await req.json();
//       if (body.bond_id) {
//         singleBondId = body.bond_id;
//       }
//     } catch {
//       // Body might be empty
//     }

//     const results: Array<{ bondId: string; success: boolean; question?: string; error?: string }> = [];

//     if (singleBondId) {
//       // Single bond mode (triggered from app)
//       console.log(`[GenerateDailyDew] Single bond mode: ${singleBondId}`);
//       const result = await processBond(supabase, singleBondId, today);
//       results.push(result);
//     } else {
//       // Batch mode (triggered by cron)
//       console.log('[GenerateDailyDew] Batch mode: processing all active bonds');

//       // Get all active coupled bonds
//       const { data: bonds, error: bondsError } = await supabase
//         .from('bonds')
//         .select('id')
//         .eq('is_active', true)
//         .eq('status', 'couple');

//       if (bondsError) throw bondsError;

//       if (!bonds || bonds.length === 0) {
//         console.log('[GenerateDailyDew] No active bonds found');
//         return new Response(
//           JSON.stringify({ success: true, message: 'No active bonds', results: [] }),
//           { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
//         );
//       }

//       console.log(`[GenerateDailyDew] Processing ${bonds.length} bonds`);

//       // Process bonds in parallel (with concurrency limit)
//       const BATCH_SIZE = 10;
//       for (let i = 0; i < bonds.length; i += BATCH_SIZE) {
//         const batch = bonds.slice(i, i + BATCH_SIZE);
//         const batchResults = await Promise.all(
//           batch.map((bond) => processBond(supabase, bond.id, today))
//         );
//         results.push(...batchResults);
//       }
//     }

//     const successCount = results.filter((r) => r.success).length;
//     const failCount = results.filter((r) => !r.success).length;

//     console.log(`[GenerateDailyDew] Complete. Success: ${successCount}, Failed: ${failCount}`);

//     return new Response(
//       JSON.stringify({
//         success: true,
//         date: today,
//         processed: results.length,
//         successful: successCount,
//         failed: failCount,
//         results,
//       }),
//       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
//     );

//   } catch (error: unknown) {
//     const message = error instanceof Error ? error.message : 'Unknown error';
//     console.error('[GenerateDailyDew] Fatal error:', message);

//     return new Response(
//       JSON.stringify({ success: false, error: message }),
//       { 
//         status: 500, 
//         headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
//       }
//     );
//   }
// });
