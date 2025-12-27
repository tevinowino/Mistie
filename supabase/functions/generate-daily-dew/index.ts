// // Follow this setup guide to integrate the Deno language server with your editor:
// // https://deno.land/manual/getting_started/setup_your_environment
// // This enables autocomplete, go to definition, etc.

// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

// // Helper to calculate age from birthdate
// const getAge = (birthDate: string) => {
//   if (!birthDate) return 18; // Default
//   const diff = Date.now() - new Date(birthDate).getTime();
//   return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
// }

// // --------------------------------------------------------------------------------
// // HELPER: Generate Dews via AI (returns array of strings)
// // --------------------------------------------------------------------------------
// async function generateFreshDews(apiKey: string, count: number, dynamic: string, anchors: string) {
//   const systemPrompt = `
// Generate exactly ${count} unique, intimate, thought-provoking questions for a couple to answer daily.

// Context:
// - Relationship Dynamic: ${dynamic || 'General Couple'}
// - Relationship Anchors/History: ${anchors || 'None provided'}
// - Purpose: Build connection, understanding, and intimacy.

// Constraints:
// - Maximum 15-20 words per question.
// - No introductory text. No numbering.
// - Output ONLY a JSON array of strings.
// - Example: ["What is one thing I do that makes you feel safe?", "What is your favorite memory of us from last month?"]
// `;

//   const response = await fetch(GEMINI_API_URL, {
//     method: 'POST',
//     headers: { 
//       'Content-Type': 'application/json',
//       'x-goog-api-key': apiKey
//     },
//     body: JSON.stringify({
//       contents: [{ parts: [{ text: systemPrompt }] }],
//       generationConfig: { temperature: 0.8 }
//     })
//   });

//   if (!response.ok) {
//     const txt = await response.text();
//     console.error(`AI Error (${response.status}):`, txt);
//     return [];
//   }

//   const data = await response.json();
//   const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
//   try {
//     const jsonMatch = text.match(/\[[\s\S]*\]/);
//     if (jsonMatch) {
//       return JSON.parse(jsonMatch[0]); // Returns string[]
//     } else {
//       console.warn("AI didn't return JSON array:", text);
//       return [];
//     }
//   } catch (e) {
//     console.error("Failed to parse AI response", e);
//     return [];
//   }
// }

// // --------------------------------------------------------------------------------
// // MAIN LOGIC: Process Single Bond
// // --------------------------------------------------------------------------------
// async function processBond(supabase: any, bondId: string, apiKey: string) {
//   try {
//     const today = new Date().toISOString().split('T')[0];

//     // 1. Check if Dew exists for today
//     const { data: existingDew } = await supabase
//       .from('daily_dews')
//       .select('id, question_text')
//       .eq('bond_id', bondId)
//       .eq('scheduled_for', today)
//       .maybeSingle();

//     if (existingDew) {
//       return { bondId, success: true, message: 'Already exists', question: existingDew.question_text };
//     }

//     // 2. Fetch Bond Context
//     const { data: bond } = await supabase
//       .from('bonds')
//       .select(`
//         id, dynamic, 
//         user1:user_1_id(birth_date),
//         user2:user_2_id(birth_date)
//       `)
//       .eq('id', bondId)
//       .single();

//     if (!bond) throw new Error('Bond not found');

//     const age1 = bond.user1?.birth_date ? getAge(bond.user1.birth_date) : 18;
//     const age2 = bond.user2?.birth_date ? getAge(bond.user2.birth_date) : 18;
//     const minCoupleAge = Math.min(age1, age2);

//     // Fetch Anchors (optional context)
//     const { data: anchorsData } = await supabase
//       .from('relationship_anchors')
//       .select('key, value')
//       .eq('bond_id', bondId);
    
//     const anchorText = anchorsData?.map((a: any) => `${a.key}: ${a.value}`).join(', ') || "";

//     // 3. Get Seen History (to exclude)
//     const { data: seenData } = await supabase
//       .from('bond_seen_prompts')
//       .select('prompt_id')
//       .eq('bond_id', bondId)
//       .eq('type', 'dew');
    
//     const seenIds = seenData?.map((s: any) => s.prompt_id) || [];

//     // 4. Query Global Pool
//     // For Dews, we want broadly applicable or dynamic-specific
//     let query = supabase
//       .from('daily_dew_prompts')
//       .select('id, question_text')
//       .lte('min_age', minCoupleAge); // Ensure age appropriate

//     // Filter by Dynamic (if column allows array containment, or just generic search)
//     // Assuming schema: dynamic text[]
//     if (bond.dynamic) {
//       // Logic: Get prompts that are either generic (dynamic IS NULL or empty) OR match our dynamic
//       // Supabase strict filtering might be tricky with OR on array columns. 
//       // Simplified: Just get generally available ones. 
//       // OR better: Post-filter or use a simpler query. 
//       // Let's rely on random selection from the pool.
//     }

//     if (seenIds.length > 0) {
//       query = query.not('id', 'in', `(${seenIds.join(',')})`);
//     }

//     // Fetch batch
//     const { data: candidates } = await query.limit(10); // Get 10 candidates
//     let selectionCandidate = null;

//     // 5. If Not Enough Candidates -> Generate with AI
//     if (!candidates || candidates.length < 3) {
//       console.log(`[${bondId}] Pool low (${candidates?.length ?? 0}). Calls AI...`);
//       const newQuestions = await generateFreshDews(apiKey, 5, bond.dynamic, anchorText);
      
//       // Save to Global Pool
//       for (const qText of newQuestions) {
//         // Insert with 'dynamic' tag
//         const { data: saved, error } = await supabase
//           .from('daily_dew_prompts')
//           .insert({
//             question_text: qText,
//             dynamic: bond.dynamic ? [bond.dynamic] : [],
//             min_age: 0 // Default to safe
//           })
//           .select()
//           .single();
        
//         if (saved && !selectionCandidate) {
//           selectionCandidate = saved; // Pick the first new one as our winner
//         }
//       }
//     } 
    
//     // If we didn't generate new ones (or failed to), pick from candidates
//     if (!selectionCandidate && candidates && candidates.length > 0) {
//       // Random pick
//       selectionCandidate = candidates[Math.floor(Math.random() * candidates.length)];
//     }

//     // 6. Final Fallback (Simulate simple question if everything fails)
//     if (!selectionCandidate) {
//       selectionCandidate = { 
//         id: null, 
//         question_text: "What is one thing you are grateful for today?" 
//       };
//     }

//     // 7. Schedule Dew (Insert into daily_dews)
//     const { error: dewError } = await supabase
//       .from('daily_dews')
//       .insert({
//         bond_id: bondId,
//         question_text: selectionCandidate.question_text,
//         scheduled_for: today,
//         is_revealed: false
//       });

//     if (dewError) throw dewError;

//     // 8. Mark as Seen (if it came from the global pool with an ID)
//     if (selectionCandidate.id) {
//       await supabase.from('bond_seen_prompts').insert({
//         bond_id: bondId,
//         prompt_id: selectionCandidate.id,
//         type: 'dew'
//       });
//     }

//     return { bondId, success: true, question: selectionCandidate.question_text };

//   } catch (err: any) {
//     console.error(`Error processing bond ${bondId}:`, err);
//     return { bondId, success: false, error: err.message };
//   }
// }

// // --------------------------------------------------------------------------------
// // SERVER ENTRYPOINT
// // --------------------------------------------------------------------------------
// Deno.serve(async (req) => {
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { 
//       headers: {
//         'Access-Control-Allow-Origin': '*',
//         'Access-Control-Allow-Methods': 'POST, OPTIONS',
//         'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
//       }
//     });
//   }

//   try {
//     const supabase = createClient(
//       Deno.env.get('SUPABASE_URL') ?? '',
//       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
//     );
//     const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
//     if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");

//     let bond_id;
//     try {
//       const body = await req.json();
//       bond_id = body.bond_id;
//     } catch {
//       // Body might be empty
//     }

//     const results = [];

//     if (bond_id) {
//       // Single Mode
//       const result = await processBond(supabase, bond_id, GEMINI_API_KEY);
//       results.push(result);
//     } else {
//       // Batch Mode: Fetch active couples
//       // TODO: Pagination for large datasets
//       const { data: bonds, error: bondsError } = await supabase
//         .from('bonds')
//         .select('id')
//         .eq('is_active', true)
//         .neq('status', 'pending'); 

//       if (bondsError) throw bondsError;
//       if (bonds) {
//         // Parallel processing (limit concurrency in production!)
//         const batchResults = await Promise.all(bonds.map((b: any) => processBond(supabase, b.id, GEMINI_API_KEY)));
//         results.push(...batchResults);
//       }
//     }

//     return new Response(JSON.stringify({ success: true, results }), {
//       headers: { 'Content-Type': 'application/json' },
//     });

//   } catch (error: any) {
//     return new Response(JSON.stringify({ error: error.message }), {
//       status: 400,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }
// });
