// // Follow this setup guide to integrate the Deno language server with your editor:
// // https://deno.land/manual/getting_started/setup_your_environment
// // This enables autocomplete, go to definition, etc.

// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// // Gemini API endpoint
// const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

// // Heat level descriptions for AI context
// const HEAT_DESCRIPTIONS: Record<number, string> = {
//   1: "Mild - Suggestive but tasteful. Use romantic innuendos and light teasing. No explicit content.",
//   2: "Warm - Getting frisky. Moderate sexual content, flirty and playful. Use suggestive language.",
//   3: "Hot - Steamy territory. Explicit language allowed, physical dares, sexual themes.",
//   4: "Inferno - No limits. Uncensored, graphic sexual content. Bold and provocative."
// }

// // Game type specific prompt templates
// const GAME_PROMPTS: Record<string, (heatLevel: number, mode: string) => string> = {
//   'would-you-rather': (_heatLevel: number, _mode: string) => `
// Generate exactly 50 unique "Would You Rather" dilemmas for romantic couples on a date night.

// Requirements:
// - Mix of silly, romantic, thought-provoking, AND mildly intimate topics
// - Each must have exactly 2 options (A and B)
// - Keep options roughly equal in difficulty
// - Include some date-night specific scenarios
// - Include a FEW intimacy/sexual topics (keep them tasteful but spicy)

// Topic distribution (approximate):
// - 15 funny/silly dilemmas
// - 15 romantic/sweet dilemmas
// - 10 thought-provoking/deep dilemmas
// - 10 mildly intimate/sexy dilemmas (suggestive but not explicit)

// Response format - return ONLY a valid JSON array, no markdown:
// [{"optionA": "first option", "optionB": "second option"}, ...]
// `,

//   'would-you-rather-hot': (heatLevel: number, mode: string) => `
// Generate exactly 50 unique "Would You Rather" dilemmas for consenting adult couples.

// Heat Level: ${heatLevel} - ${HEAT_DESCRIPTIONS[heatLevel]}
// Mode: ${mode === 'virtual' ? 'Long-distance/video call compatible' : 'In-person, physical presence'}

// Requirements:
// - All dilemmas must match the specified heat level
// - Each must have exactly 2 options (A and B)
// - Keep options roughly equal in appeal
// - ${mode === 'virtual' ? 'All options must be doable over video call' : 'Options can involve physical presence'}
// - Be creative and varied
// - This is for 18+ verified users only

// Response format - return ONLY a valid JSON array, no markdown:
// [{"optionA": "first option", "optionB": "second option"}, ...]
// `,

//   'intimacy': (heatLevel: number, mode: string) => `
// Generate exactly 50 unique intimacy prompts for consenting adult couples.

// Heat Level: ${heatLevel} - ${HEAT_DESCRIPTIONS[heatLevel]}
// Mode: ${mode === 'virtual' ? 'Long-distance/video call compatible' : 'In-person, physical presence'}

// Requirements:
// - All prompts must match the specified heat level
// - Focus on building physical and emotional connection
// - ${mode === 'virtual' ? 'All prompts must be doable over video call' : 'Prompts can involve physical touch'}
// - Mix of verbal, emotional, and physical intimacy
// - This is for 18+ verified users only

// Response format - return ONLY a valid JSON array, no markdown:
// [{"prompt": "the intimacy prompt text"}, ...]
// `,

//   'hard-dare': (heatLevel: number, mode: string) => `
// Generate exactly 50 unique dares for consenting adult couples.

// Heat Level: ${heatLevel} - ${HEAT_DESCRIPTIONS[heatLevel]}
// Mode: ${mode === 'virtual' ? 'Long-distance/video call compatible' : 'In-person, physical presence'}

// Requirements:
// - All dares must match the specified heat level
// - Dares should push boundaries but remain consensual
// - ${mode === 'virtual' ? 'All dares must be doable over video call' : 'Dares can require physical presence'}
// - Mix of sensual, playful, and bold challenges
// - This is for 18+ verified users only

// Response format - return ONLY a valid JSON array, no markdown:
// [{"dare": "the dare text"}, ...]
// `,

//   'crush': (_heatLevel: number, _mode: string) => `
// Generate exactly 50 unique flirty prompts for couples in the early stages of romance or wanting to rekindle that spark.

// Requirements:
// - Sweet spot between romance and deep conversation
// - Flirty but not explicit
// - Mix of playful, romantic, and curiosity-inducing prompts
// - Suitable for all relationship stages

// Response format - return ONLY a valid JSON array, no markdown:
// [{"prompt": "the flirty prompt text"}, ...]
// `,

//   'deep-night': (_heatLevel: number, _mode: string) => `
// Generate exactly 50 unique late-night conversation prompts for couples.

// Requirements:
// - Focus on vulnerability and deep sharing
// - Late-night confession vibes
// - Emotionally intimate without being overly sexual. It can include a few mildly sexual topics, but not explicit.
// - Mix of reflective, dream-sharing, and soul-baring prompts

// Response format - return ONLY a valid JSON array, no markdown:
// [{"prompt": "the deep night prompt text"}, ...]
// `,

//   'is-it-okay': (_heatLevel: number, _mode: string) => `
// Generate exactly 50 unique "Is it okay?" debate questions for couples.

// Requirements:
// - Controversial but not harmful relationship questions
// - Questions that spark healthy debate and discussion
// - Mix of serious and funny scenarios
// - Topics like: social media, exes, friends, money, family, boundaries

// Example: "Is it okay to keep photos of an ex on your phone?"

// Response format - return ONLY a valid JSON array, no markdown:
// [{"question": "Is it okay to..."}, ...]
// `,

//   'connected': (_heatLevel: number, _mode: string) => `
// Generate exactly 50 unique conversation prompts to strengthen emotional connection between couples.

// Requirements:
// - Focus on building emotional foundations
// - Meaningful dialogue starters
// - Mix of present-focused and future-focused questions
// - Help couples understand each other better

// Response format - return ONLY a valid JSON array, no markdown:
// [{"prompt": "the connection prompt text"}, ...]
// `,

//   'whos-more-likely': (_heatLevel: number, _mode: string) => `
// Generate exactly 50 unique "Who's more likely to..." questions for couples.

// Requirements:
// - Fun, superlative-style comparisons
// - Mix of silly, romantic, and personality-based
// - Both positive and playfully embarrassing scenarios
// - Easy to answer with "me" or "my partner"

// Response format - return ONLY a valid JSON array, no markdown:
// [{"question": "Who's more likely to..."}, ...]
// `,

//   'memory-lane': (_heatLevel: number, _mode: string) => `
// Generate exactly 50 unique memory-focused prompts for couples.

// Requirements:
// - Nostalgic journey through relationship milestones
// - Questions about shared experiences and favorite moments
// - Mix of: first dates, anniversaries, funny stories, challenges overcome
// - Help couples reminisce and appreciate their journey

// Response format - return ONLY a valid JSON array, no markdown:
// [{"prompt": "the memory lane prompt text"}, ...]
// `,

//   'mirror': (_heatLevel: number, _mode: string) => `
// Generate exactly 50 unique "How well do you know me?" quiz questions for couples.

// Requirements:
// - Questions one partner answers about the other
// - Mix of preferences, habits, dreams, and personality
// - Varying difficulty levels
// - Fun to get right and revealing when wrong

// Response format - return ONLY a valid JSON array, no markdown:
// [{"question": "What is my partner's favorite..."}, ...]
// `,

//   'tell-me-everything': (_heatLevel: number, _mode: string) => `
// Generate exactly 50 unique total transparency prompts for couples.

// Requirements:
// - Prompts that encourage honest, open storytelling
// - Mix of past experiences, secrets, and confessions
// - Create a safe space for sharing
// - Deepen trust and understanding

// Response format - return ONLY a valid JSON array, no markdown:
// [{"prompt": "Tell me about a time when..."}, ...]
// `,

//   'between-us': (_heatLevel: number, _mode: string) => `
// Generate exactly 50 unique wildcard prompts for couples - mix of funny and serious.

// Requirements:
// - Unpredictable mix of topics
// - Some funny anecdotes, some serious reflections
// - Keep partners on their toes
// - Variety is key

// Response format - return ONLY a valid JSON array, no markdown:
// [{"prompt": "the wildcard prompt text"}, ...]
// `
// }

// interface GenerateRequest {
//   bond_id: string
//   game_type_slug: string
//   heat_level?: number
//   mode?: string
//   count?: number
// }

// Deno.serve(async (req: Request) => {
//   console.log('🚀 [generate-game-prompts] Function invoked at', new Date().toISOString())
  
//   // Handle CORS
//   if (req.method === 'OPTIONS') {
//     console.log('📋 CORS preflight request')
//     return new Response('ok', {
//       headers: {
//         'Access-Control-Allow-Origin': '*',
//         'Access-Control-Allow-Methods': 'POST, OPTIONS',
//         'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
//       }
//     })
//   }

//   try {
//     const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
//     if (!GEMINI_API_KEY) {
//       console.error('❌ GEMINI_API_KEY not configured')
//       throw new Error('GEMINI_API_KEY not configured')
//     }
//     console.log('✅ GEMINI_API_KEY found')

//     const supabaseUrl = Deno.env.get('SUPABASE_URL')!
//     const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
//     const supabase = createClient(supabaseUrl, supabaseKey)

//     const { bond_id, game_type_slug, heat_level = 2, mode = 'in_person', count = 50 }: GenerateRequest = await req.json()

//     console.log('📥 Request body:', JSON.stringify({ bond_id, game_type_slug, heat_level, mode, count }, null, 2))

//     if (!bond_id || !game_type_slug) {
//       console.error('❌ Missing required fields')
//       return new Response(
//         JSON.stringify({ error: 'bond_id and game_type_slug are required' }),
//         { status: 400, headers: { 'Content-Type': 'application/json' } }
//       )
//     }

//     // Verify bond exists and user has access
//     console.log('🔍 Looking up bond:', bond_id)
//     const { data: bond, error: bondError } = await supabase
//       .from('bonds')
//       .select('id, user_1_id, user_2_id')
//       .eq('id', bond_id)
//       .single()

//     if (bondError || !bond) {
//       console.error('❌ Bond not found:', bondError?.message)
//       return new Response(
//         JSON.stringify({ error: 'Bond not found' }),
//         { status: 404, headers: { 'Content-Type': 'application/json' } }
//       )
//     }
//     console.log('✅ Bond found')

//     // Get game type
//     console.log('🔍 Looking up game type:', game_type_slug)
//     const { data: gameType, error: gameTypeError } = await supabase
//       .from('game_types')
//       .select('id, slug, has_spice_meter')
//       .eq('slug', game_type_slug)
//       .single()

//     if (gameTypeError || !gameType) {
//       console.error('❌ Game type not found:', gameTypeError?.message)
//       return new Response(
//         JSON.stringify({ error: 'Game type not found' }),
//         { status: 404, headers: { 'Content-Type': 'application/json' } }
//       )
//     }
//     console.log('✅ Game type found:', JSON.stringify(gameType))

//     // Check existing unused prompts - NOW FILTERING BY MODE
//     console.log('🔍 Checking existing prompts for mode:', mode)
//     let query = supabase
//       .from('bond_game_prompts')
//       .select('id')
//       .eq('bond_id', bond_id)
//       .eq('game_type_id', gameType.id)
//       .eq('is_used', false)
//       .eq('mode', mode) // NEW: Filter by mode (virtual/in_person)

//     // Only filter by heat level if the game has spice meter
//     if (gameType.has_spice_meter) {
//       query = query.eq('heat_level', heat_level)
//       console.log('📊 Filtering by heat_level:', heat_level)
//     }

//     const { data: existingPrompts } = await query
//     console.log('📊 Existing prompts for mode "' + mode + '":', existingPrompts?.length || 0)

//     // If we have enough prompts, return early
//     if (existingPrompts && existingPrompts.length >= 10) {
//       console.log('✅ Using cached prompts for mode:', mode, 'count:', existingPrompts.length)
//       return new Response(
//         JSON.stringify({ 
//           cached: true, 
//           count: existingPrompts.length,
//           mode,
//           message: `Using ${existingPrompts.length} cached prompts for ${mode}`
//         }),
//         { headers: { 'Content-Type': 'application/json' } }
//       )
//     }

//     // Generate prompts with AI - mode-specific prompts will be generated
//     console.log('📝 Need to generate new prompts for mode:', mode, 'Existing:', existingPrompts?.length || 0)
//     const promptTemplate = GAME_PROMPTS[game_type_slug]
//     if (!promptTemplate) {
//       console.error('❌ No prompt template for:', game_type_slug)
//       return new Response(
//         JSON.stringify({ error: `No prompt template for game type: ${game_type_slug}` }),
//         { status: 400, headers: { 'Content-Type': 'application/json' } }
//       )
//     }

//     const systemPrompt = promptTemplate(heat_level, mode)
//     console.log('🤖 Calling Gemini API for mode:', mode)
//     console.log('📄 Prompt length:', systemPrompt.length, 'characters')

//     // Call Gemini API
//     const geminiResponse = await fetch(GEMINI_API_URL, {
//       method: 'POST',
//       headers: { 
//         'Content-Type': 'application/json',
//         'x-goog-api-key': GEMINI_API_KEY,
//       },
//       body: JSON.stringify({
//         contents: [{ parts: [{ text: systemPrompt }] }],
//         generationConfig: {
//           temperature: 0.9,
//           maxOutputTokens: 8192,
//         }
//       })
//     })

//     console.log('📡 Gemini response status:', geminiResponse.status)

//     if (!geminiResponse.ok) {
//       const errorText = await geminiResponse.text()
//       console.error('❌ Gemini API error:', geminiResponse.status, errorText)
      
//       // Fallback to seed prompts
//       console.log('📋 Attempting fallback to seed prompts...')
//       const { data: seedPrompts } = await supabase
//         .from('game_prompts')
//         .select('*')
//         .eq('game_type_id', gameType.id)
//         .eq('is_seed', true)
//         .limit(count)

//       console.log('📋 Seed prompts found:', seedPrompts?.length || 0)
//       return new Response(
//         JSON.stringify({ 
//           fallback: true, 
//           count: seedPrompts?.length || 0,
//           message: 'Using seed prompts as fallback'
//         }),
//         { headers: { 'Content-Type': 'application/json' } }
//       )
//     }

//     const geminiData = await geminiResponse.json()
//     const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
//     console.log('✅ Gemini response received, length:', responseText.length)

//     // Parse response - extract JSON array
//     let prompts: any[] = []
//     try {
//       // Try to find JSON array in response
//       const jsonMatch = responseText.match(/\[[\s\S]*\]/)
//       if (jsonMatch) {
//         prompts = JSON.parse(jsonMatch[0])
//         console.log('✅ Parsed prompts count:', prompts.length)
//       } else {
//         console.error('❌ No JSON array found in response')
//         console.log('📄 Response preview:', responseText.substring(0, 500))
//       }
//     } catch (parseError) {
//       console.error('❌ Failed to parse AI response:', parseError)
//       console.log('📄 Raw response:', responseText.substring(0, 1000))
//       return new Response(
//         JSON.stringify({ error: 'Failed to parse AI response', raw: responseText.substring(0, 500) }),
//         { status: 500, headers: { 'Content-Type': 'application/json' } }
//       )
//     }

//     if (!prompts.length) {
//       console.error('❌ No prompts in parsed array')
//       return new Response(
//         JSON.stringify({ error: 'No prompts generated' }),
//         { status: 500, headers: { 'Content-Type': 'application/json' } }
//       )
//     }

//     // Map prompts to database format based on game type
//     console.log('📝 Mapping prompts to DB format for mode:', mode)
//     const dbPrompts = prompts.map((p: any) => {
//       const base = {
//         bond_id,
//         game_type_id: gameType.id,
//         mode, // This ensures each prompt is tagged with its mode
//         heat_level: gameType.has_spice_meter ? heat_level : 1,
//         is_used: false,
//       }

//       // Handle different game types
//       if (p.optionA && p.optionB) {
//         return { ...base, prompt_text: `${p.optionA} OR ${p.optionB}`, option_a: p.optionA, option_b: p.optionB }
//       } else if (p.prompt) {
//         return { ...base, prompt_text: p.prompt }
//       } else if (p.question) {
//         return { ...base, prompt_text: p.question }
//       } else if (p.dare) {
//         return { ...base, prompt_text: p.dare }
//       } else {
//         return { ...base, prompt_text: JSON.stringify(p) }
//       }
//     })

//     console.log('📝 DB prompts prepared:', dbPrompts.length, 'for mode:', mode)
//     console.log('📝 Sample prompt:', JSON.stringify(dbPrompts[0]))

//     // Insert prompts (ignore duplicates)
//     console.log('💾 Inserting prompts to database...')
//     const { error: insertError } = await supabase
//       .from('bond_game_prompts')
//       .upsert(dbPrompts, { onConflict: 'bond_id,game_type_id,prompt_text', ignoreDuplicates: true })

//     if (insertError) {
//       console.error('❌ Insert error:', insertError)
//       return new Response(
//         JSON.stringify({ error: 'Failed to save prompts', details: insertError.message }),
//         { status: 500, headers: { 'Content-Type': 'application/json' } }
//       )
//     }

//     console.log('✅ SUCCESS! Generated and saved', dbPrompts.length, 'prompts for mode:', mode)
//     return new Response(
//       JSON.stringify({ 
//         generated: true, 
//         count: dbPrompts.length,
//         heat_level,
//         mode,
//         message: `Generated and cached ${dbPrompts.length} prompts for ${mode}`
//       }),
//       { headers: { 'Content-Type': 'application/json' } }
//     )

//   } catch (error) {
//     console.error('❌ Unhandled error:', error)
//     return new Response(
//       JSON.stringify({ error: error.message }),
//       { status: 500, headers: { 'Content-Type': 'application/json' } }
//     )
//   }
// })
