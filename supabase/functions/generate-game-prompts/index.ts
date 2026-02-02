// // Follow this setup guide to integrate the Deno language server with your editor:
// // https://deno.land/manual/getting_started/setup_your_environment
// // This enables autocomplete, go to definition, etc.

// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// // Gemini API endpoint
// const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

// // Heat level describes context for AI
// const HEAT_DESCRIPTIONS: Record<number, string> = {
//   1: "Mild - Suggestive but tasteful. Use romantic innuendos and light teasing. No explicit content.",
//   2: "Warm - Getting frisky. Moderate sexual content, flirty and playful. Use suggestive language.",
//   3: "Hot - Steamy territory. Explicit language allowed, physical dares, sexual themes.",
//   4: "Inferno - No limits. Uncensored, graphic sexual content. Bold and provocative."
// }

// // Game prompts generators - Updated to accept 'dynamic' in context
// const GAME_PROMPTS: Record<string, (heatLevel: number, mode: string, dynamic?: string) => string> = {
//   'would-you-rather': (_heatLevel, _mode, dynamic) => `
// // Generate exactly 50 unique "Would You Rather" dilemmas for a romantic couple.

// // Context:
// // - Relationship Dynamic: ${dynamic || 'General Couple'}
// // - Mix of silly, romantic, thought-provoking, AND mildly intimate topics
// // - Each must have exactly 2 options (A and B)
// // - Keep options roughly equal in difficulty

// // Response format - return ONLY a valid JSON array, no markdown:
// // [{"optionA": "first option", "optionB": "second option"}, ...]
// `,

//   'would-you-rather-hot': (heatLevel, mode, dynamic) => `
// // Generate exactly 50 unique "Would You Rather" dilemmas for consenting adult couples.

// // Context:
// // - Heat Level: ${heatLevel} - ${HEAT_DESCRIPTIONS[heatLevel]}
// // - Mode: ${mode === 'virtual' ? 'Long-distance/video call compatible' : 'In-person, physical presence'}
// // - Relationship Dynamic: ${dynamic || 'General Couple'}

// // Requirements:
// // - All dilemmas must match the specified heat level
// // - ${mode === 'virtual' ? 'All options must be doable over video call' : 'Options can involve physical presence'}
// // - This is for 18+ verified users only

// // Response format - return ONLY a valid JSON array, no markdown:
// // [{"optionA": "first option", "optionB": "second option"}, ...]
// `,

//   'intimacy': (heatLevel, mode, dynamic) => `
// // Generate exactly 50 unique intimacy prompts for consenting adult couples.

// // Context:
// // - Heat Level: ${heatLevel} - ${HEAT_DESCRIPTIONS[heatLevel]}
// // - Mode: ${mode === 'virtual' ? 'Long-distance/video call compatible' : 'In-person, physical presence'}
// // - Relationship Dynamic: ${dynamic || 'General Couple'}

// // Requirements:
// // - Focus on building physical and emotional connection
// // - ${mode === 'virtual' ? 'All prompts must be doable over video call' : 'Prompts can involve physical touch'}
// // - This is for 18+ verified users only

// // Response format - return ONLY a valid JSON array, no markdown:
// // [{"prompt": "the intimacy prompt text"}, ...]
// `,

//   'hard-dare': (heatLevel, mode, dynamic) => `
// // Generate exactly 50 unique dares for consenting adult couples.

// // Context:
// // - Heat Level: ${heatLevel} - ${HEAT_DESCRIPTIONS[heatLevel]}
// // - Mode: ${mode === 'virtual' ? 'Long-distance/video call compatible' : 'In-person, physical presence'}
// // - Relationship Dynamic: ${dynamic || 'General Couple'}

// // Requirements:
// // - Dares should push boundaries but remain consensual
// // - ${mode === 'virtual' ? 'All dares must be doable over video call' : 'Dares can require physical presence'}
// // - This is for 18+ verified users only

// // Response format - return ONLY a valid JSON array, no markdown:
// // [{"dare": "the dare text"}, ...]
// `,

//   'crush': (_heatLevel, _mode, dynamic) => `
// // Generate exactly 50 unique flirty prompts for couples.

// // Context:
// // - Relationship Dynamic: ${dynamic || 'Crush/Dating'}
// // - Sweet spot between romance and deep conversation
// // - Flirty but not explicit

// // Response format - return ONLY a valid JSON array, no markdown:
// // [{"prompt": "the flirty prompt text"}, ...]
// `,

//   'deep-night': (_heatLevel, _mode, dynamic) => `
// // Generate exactly 50 unique late-night conversation prompts.

// // Context:
// // - Relationship Dynamic: ${dynamic || 'General Couple'}
// // - Focus on vulnerability and deep sharing
// // - Late-night confession vibes

// // Response format - return ONLY a valid JSON array, no markdown:
// // [{"prompt": "the deep night prompt text"}, ...]
// `,

//   'is-it-okay': (_heatLevel, _mode, dynamic) => `
// // Generate exactly 50 unique "Is it okay?" debate questions.

// // Context:
// // - Relationship Dynamic: ${dynamic || 'General Couple'}
// // - Controversial but not harmful relationship questions
// // - Mix of serious and funny scenarios

// // Response format - return ONLY a valid JSON array, no markdown:
// // [{"question": "Is it okay to..."}, ...]
// `,

//   'connected': (_heatLevel, _mode, dynamic) => `
// // Generate exactly 50 unique conversation prompts to strengthen emotional connection.

// // Context:
// // - Relationship Dynamic: ${dynamic || 'General Couple'}
// // - Focus on building emotional foundations
// // - Meaningful dialogue starters

// // Response format - return ONLY a valid JSON array, no markdown:
// // [{"prompt": "the connection prompt text"}, ...]
// `,

//   'whos-more-likely': (_heatLevel, _mode, dynamic) => `
// // Generate exactly 50 unique "Who's more likely to..." questions.

// // Context:
// // - Relationship Dynamic: ${dynamic || 'General Couple'}
// // - Fun, superlative-style comparisons

// // Response format - return ONLY a valid JSON array, no markdown:
// // [{"question": "Who's more likely to..."}, ...]
// `,

//   'memory-lane': (_heatLevel, _mode, dynamic) => `
// // Generate exactly 50 unique memory-focused prompts.

// // Context:
// // - Relationship Dynamic: ${dynamic || 'General Couple'}
// // - Nostalgic journey through relationship milestones

// // Response format - return ONLY a valid JSON array, no markdown:
// // [{"prompt": "the memory lane prompt text"}, ...]
// `,

//   'mirror': (_heatLevel, _mode, dynamic) => `
// // Generate exactly 50 unique "How well do you know me?" quiz questions.

// // Context:
// // - Relationship Dynamic: ${dynamic || 'General Couple'}
// // - Questions one partner answers about the other

// // Response format - return ONLY a valid JSON array, no markdown:
// // [{"question": "What is my partner's favorite..."}, ...]
// `,

//   'tell-me-everything': (_heatLevel, _mode, dynamic) => `
// // Generate exactly 50 unique total transparency prompts.

// // Context:
// // - Relationship Dynamic: ${dynamic || 'General Couple'}
// // - Prompts that encourage honest, open storytelling

// // Response format - return ONLY a valid JSON array, no markdown:
// // [{"prompt": "Tell me about a time when..."}, ...]
// `,

//   'between-us': (_heatLevel, _mode, dynamic) => `
// // Generate exactly 50 unique wildcard prompts - mix of funny and serious.

// // Context:
// // - Relationship Dynamic: ${dynamic || 'General Couple'}
// // - Unpredictable mix of topics

// // Here are sample questions: 
// // Game Content Samples: Couples App

// // 1. Discovery Section

// // Objective: New sparks, late-night vibes, and testing boundaries.

// // Crush (Flirty & Deep)

// // "What was the very first thing noticed about the partner that made you want to keep talking?" (Dynamic: All)

// // "If the couple were to disappear for a weekend right now, where should the destination be?" (Dynamic: All)

// // "What is a 'secret' physical attraction towards the partner that hasn't been mentioned yet?" (Dynamic: Dating, Situationship)

// // "What is one thing that is usually too shy to be said to someone who is liked?" (Dynamic: Crush, Situationship)

// // "If the relationship was a movie genre, would it be a rom-com, a drama, or a thriller?" (Dynamic: All)

// // Deep Night (Confessions & Vulnerability)

// // "What is a recurring pattern from childhood that is most feared to be repeated in this relationship?" (Dynamic: Dating, Married)

// // "Do you believe that society's current definition of 'success' is actually a trap? What would a 'successful' life look like if money didn't exist?" (Dynamic: All)

// // "In your opinion, is sexual desire an expression of love, or can it be entirely detached? How does that view impact the couple's intimacy?" (Dynamic: All)

// // "If there was a choice between a partner who challenged every belief but forced growth, or a partner who provided absolute peace but never challenged anything, which would be picked?" (Dynamic: All)

// // "What is the most 'unforgivable' thing someone could do, and does that boundary come from a place of principle or a past trauma?" (Dynamic: All)

// // Is it Okay? (Controversial & Fun)

// // "Is it okay to have a 'work spouse' that everything is shared with?" (Dynamic: All)

// // "Is it okay to stay close friends with an ex if the relationship ended years ago?" (Dynamic: All)

// // "Is it okay to check a partner's phone if there is a gut feeling something is wrong?" (Dynamic: Dating, Married)

// // "Is it okay to go on a vacation without the partner every single year?" (Dynamic: Dating, Married)

// // "Is it okay to still have a crush on a celebrity when in a committed relationship?" (Dynamic: All)

// // 2. As a Couple Section

// // Objective: Strengthening the unit, identifying loopholes, and aligning goals.

// // Connected (Growth & Dreams)

// // "What is one dream that has been hesitant to be chased, and how can the partner specifically act as a safety net during the pursuit?" (Dynamic: Dating, Engaged, Married)

// // "Where is the most growth visible in the relationship over the last six months, and what was the specific moment that triggered that progress?" (Dynamic: Dating, Married)

// // "If the couple were to build a 5-year 'unit legacy,' what would be the top three values that define the household?" (Dynamic: Engaged, Married)

// // "What is a personal goal for this year that the partner doesn't fully understand yet?" (Dynamic: All)

// // "When is the feeling of being 'powerful' as a person most frequent, and how can the partner help tap into that feeling more often?" (Dynamic: All)

// // Relationship Loopholes (Audit & Fixes)

// // "What is a 'loophole' or recurring friction point in the relationship's communication where the couple always seems to misunderstand each other? How can it be patched tonight?" (Dynamic: Dating, Married)

// // "Is there an area in the life shared where one person feels like they are doing the 'heavy lifting' alone? How can that weight be redistributed?" (Dynamic: Married)

// // "What is one 'unspoken rule' in the relationship that actually limits potential as a couple?" (Dynamic: All)

// // "When the couple fights, what is the one thing the partner does that causes a shutdown rather than an opening up?" (Dynamic: Dating, Married)

// // "If the relationship had a 'vulnerability check,' which part of the dynamic feels the most fragile right now?" (Dynamic: All)

// // Unit Dynamic (Building Strength)

// // "In what way is this team better than any other couple? What is the 'unit superpower'?" (Dynamic: All)

// // "How has the dynamic been influenced by friends or family, and do better boundaries need to be set to protect the unit?" (Dynamic: Dating, Married)

// // "What is the most important lesson learned from the hardest season shared together?" (Dynamic: Dating, Married)

// // "If the world were to end tomorrow, would the time spent building this world feel sufficient, or was there too much distraction by external factors?" (Dynamic: All)

// // "What does 'loyalty' look like in small, everyday moments, rather than just the big ones?" (Dynamic: All)

// // Intimacy & Sex (Deep Alignment)

// // "How has the view of sexual intimacy changed as the emotional connection grew? Does one drive the other?" (Dynamic: Dating, Married)

// // "Is there a specific way to be approached for intimacy that the partner often misses or overlooks?" (Dynamic: Dating, Married)

// // "What does 'sexual growth' look like for the unit over the next year? Are there barriers that haven't been broken down yet?" (Dynamic: All)

// // "How can the bedroom be made a 'judgment-free zone' for things the couple has been too shy to try or talk about?" (Dynamic: All)

// // "Does the physical connection reflect the current health of the emotional connection? Why or why not?" (Dynamic: Dating, Married)

// // 3. Date Night Section

// // Objective: Fun, dilemmas, and transparency.

// // Tell Me Everything (Transparency)

// // "What is a secret talent that has never been shown to the partner?" (Dynamic: All)

// // "What was the most embarrassing 'fail' in front of a group of people?" (Dynamic: All)

// // "What is the biggest lie ever told to get out of a social situation?" (Dynamic: All)

// // "Describe a time when the feeling of being truly brave was present." (Dynamic: All)

// // "What is the one thing to be remembered for?" (Dynamic: All)

// // Between Us (Wildcard Mix)

// // "If lives could be switched for 24 hours, what is the first thing to be done while in the partner's body?" (Dynamic: All)

// // "What is the weirdest dream ever had that involved the partner?" (Dynamic: All)

// // "If forced to move to a different country tomorrow, where should the couple go?" (Dynamic: All)

// // "What is one thing the couple should work on together this month?" (Dynamic: Dating, Married)

// // "What is the most ridiculous thing believed as a child?" (Dynamic: All)

// // Would You Rather (Classic Dilemmas)

// // "Would you rather always have to tell the truth or always have to hear the truth from the partner?" (Dynamic: All)

// // "Would you rather have a personal chef or a personal driver for the household?" (Dynamic: Married)

// // "Would you rather go on a luxury city vacation or a rugged camping trip?" (Dynamic: All)

// // "Would you rather spend every weekend together but never leave the house, or only see each other once a month but go on a world tour?" (Dynamic: All)

// // "Would you rather be able to read the partner's mind for one hour or be able to see one year into the future of the relationship?" (Dynamic: All)

// // 4. Little Spice Section (18+)

// // Objective: Progressive intensity leading to physical or virtual intimacy.

// // Mild (Teasing & Tension)

// // Would You Rather: "Would you rather spend the next hour whispering things to be done to the partner in their ear, or have the partner send flirty texts from across the room?"

// // Intimacy: "What is one part of the partner's body that is currently a priority to touch but hasn't been yet?"

// // The Brush:

// // In-Person: Slowly run fingers along the partner's inner thigh for 30 seconds while maintaining eye contact.

// // Virtual: Send a 5-second video biting a lip while thinking about the partner.

// // Confession: "If the couple were alone in an elevator right now, where would the partner be kissed?"

// // The Scent: "What is the favorite 'natural' smell on the partner that drives the senses crazy?"

// // Hot (Arousal & Action)

// // Would You Rather: "Would you rather have the partner slowly undress the player while blindfolded, or have the partner watch the player undress while they describe how sexy it looks?"

// // The Command:

// // In-Person: Take off one piece of the partner's clothing using only the teeth.

// // Virtual: Turn around and show the partner the favorite view of the body on camera for 1 minute.

// // The Tease:

// // In-Person: Give the partner a hickey in a place that won't be seen by anyone else tomorrow.

// // Virtual: Describe exactly how the tongue would be used on the partner right now until the partner gives the command to stop.

// // Intimacy: "What is a 'taboo' fantasy involving the couple that was too intimidating to bring up until today?"

// // The Visual: "Put on that one outfit the partner loves, or nothing at all, and go sit on the partner's lap (or show them on screen)."

// // Inferno (No Limits - Leading to Sex)

// // The Submission: (Here, we should try and create as much sexual frustration as possible)

// // In-Person: Have the player get on their knees right now and stay there until the partner gives permission to move. Strip for the partner while staying in that position.

// // Virtual: Show the partner exactly how much they are wanted. Get naked on camera and describe every filthy thing to be done to the partner when finally touching.

// // The Deep Dive:

// // In-Person: Lay the partner back and strip them. Taste the partner until they cannot stop shaking.

// // Virtual: Have the partner watch as two fingers are used to show everything. Describe exactly how it feels while moaning the partner's name.

// // The Absolute Command:

// // In-Person: Initiate sex immediately. Take exactly what is wanted from the partner's body.

// // Virtual: Ensure the partner sees the finish. Do not look away from the camera. State the second the orgasm is about to happen and describe the mess being made.

// // No-Filter Would You Rather:

// // Both: "Would you rather have the partner cum all over the face and be forced to taste it, or have the partner take control from behind while their name is screamed?"

// // The Ultimate Fantasy:

// // In-Person: Stop the game right now. Pin the partner down and execute that one filthy thing always imagined but never requested.

// // Virtual: Position the camera between the legs. Show every detail while talking dirty to the partner and explaining how badly they are wanted inside.

// // Do not include the type of questions. Just return the value, e.g. Have your player get on their knees right now and stay there until the partner gives permission to move. Strip for the partner while staying in that position.


// // Response format - return ONLY a valid JSON array, no markdown:
// // [{"prompt": "the wildcard prompt text"}, ...]
// `
// }

// interface GenerateRequest {
//   bond_id: string
//   game_type_slug: string
//   heat_level?: number
//   mode?: string
//   count?: number // Number of prompts to return to client (default 30)
// }

// // Constants
// const AI_BATCH_SIZE = 50; // Always generate 50 prompts per AI call
// const DEFAULT_RETURN_COUNT = 30; // UPDATED to 30 as per request

// Deno.serve(async (req: Request) => {
//   const startTime = Date.now();
//   console.log('====================================================')
//   console.log('🚀 [generate-game-prompts] Function invoked')
//   console.log(`📅 Timestamp: ${new Date().toISOString()}`)
//   console.log('====================================================')

//   if (req.method === 'OPTIONS') {
//     console.log('📋 Handling OPTIONS preflight request')
//     return new Response('ok', {
//       headers: {
//         'Access-Control-Allow-Origin': '*',
//         'Access-Control-Allow-Methods': 'POST, OPTIONS',
//         'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
//       }
//     })
//   }

//   try {
//     // 0. Environment & Config Check
//     console.log('🔧 [Step 0] Checking environment configuration...')
//     const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
//     const supabaseUrl = Deno.env.get('SUPABASE_URL')
//     const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

//     if (!GEMINI_API_KEY) {
//       console.error('❌ GEMINI_API_KEY is not configured!')
//       throw new Error('GEMINI_API_KEY not configured')
//     }
//     console.log('✅ GEMINI_API_KEY is set (length: ' + GEMINI_API_KEY.length + ')')

//     if (!supabaseUrl || !supabaseKey) {
//       console.error('❌ Supabase credentials missing!')
//       throw new Error('Supabase credentials not configured')
//     }
//     console.log('✅ Supabase credentials are set')
//     console.log(`   URL: ${supabaseUrl}`)

//     const supabase = createClient(supabaseUrl, supabaseKey)
//     console.log('✅ Supabase client initialized')

//     // 1. Parse Request Body
//     console.log('----------------------------------------------------')
//     console.log('📥 [Step 1] Parsing request body...')
//     const requestBody = await req.json()
//     const { 
//       bond_id, 
//       game_type_slug, 
//       heat_level = 2, 
//       mode = 'in_person', 
//       count = DEFAULT_RETURN_COUNT 
//     }: GenerateRequest = requestBody

//     console.log('📦 Request Parameters:')
//     console.log(`   - bond_id: ${bond_id}`)
//     console.log(`   - game_type_slug: ${game_type_slug}`)
//     console.log(`   - heat_level: ${heat_level}`)
//     console.log(`   - mode: ${mode}`)
//     console.log(`   - count (requested): ${count}`)

//     if (!bond_id || !game_type_slug) {
//       console.error('❌ Missing required parameters!')
//       return new Response(JSON.stringify({ error: 'Missing bond_id or game_type_slug' }), { 
//         status: 400,
//         headers: { 'Content-Type': 'application/json' }
//       })
//     }

//     // 2. Fetch Bond Details
//     console.log('----------------------------------------------------')
//     console.log('🔗 [Step 2] Fetching bond details...')
//     const bondFetchStart = Date.now()
//     const { data: bond, error: bondError } = await supabase
//       .from('bonds')
//       .select(`
//         id, 
//         dynamic,
//         user1:user_1_id(birth_date),
//         user2:user_2_id(birth_date)
//       `)
//       .eq('id', bond_id)
//       .single()

//     console.log(`   Query took: ${Date.now() - bondFetchStart}ms`)

//     if (bondError) {
//       console.error('❌ Bond fetch error:', bondError)
//       throw new Error(`Bond not found: ${bondError.message}`)
//     }
//     if (!bond) {
//       console.error('❌ Bond not found (null result)')
//       throw new Error('Bond not found')
//     }

//     console.log('✅ Bond found:')
//     console.log(`   - Bond ID: ${bond.id}`)
//     console.log(`   - Dynamic: ${bond.dynamic || 'Not set'}`)

//     // Calculate minimum age of the couple
//     const getAge = (birthDate: string) => {
//       if (!birthDate) return 18;
//       const diff = Date.now() - new Date(birthDate).getTime();
//       return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
//     }
//     const age1 = bond.user1?.birth_date ? getAge(bond.user1.birth_date) : 18;
//     const age2 = bond.user2?.birth_date ? getAge(bond.user2.birth_date) : 18;
//     const minCoupleAge = Math.min(age1, age2);

//     console.log(`   - User 1 Age: ${age1}`)
//     console.log(`   - User 2 Age: ${age2}`)
//     console.log(`   - Min Couple Age: ${minCoupleAge}`)

//     // 3. Fetch Game Type
//     console.log('----------------------------------------------------')
//     console.log('🎮 [Step 3] Fetching game type...')
//     const gameTypeFetchStart = Date.now()
//     const { data: gameType, error: gameTypeError } = await supabase
//       .from('game_types')
//       .select('id, slug, name, has_spice_meter, is_adult')
//       .eq('slug', game_type_slug)
//       .single()

//     console.log(`   Query took: ${Date.now() - gameTypeFetchStart}ms`)

//     if (gameTypeError) {
//       console.error('❌ Game type fetch error:', gameTypeError)
//       throw new Error(`Game type not found: ${gameTypeError.message}`)
//     }
//     if (!gameType) {
//       console.error('❌ Game type not found for slug:', game_type_slug)
//       throw new Error('Game type not found')
//     }

//     console.log('✅ Game type found:')
//     console.log(`   - ID: ${gameType.id}`)
//     console.log(`   - Name: ${gameType.name}`)
//     console.log(`   - Slug: ${gameType.slug}`)
//     console.log(`   - Is Adult: ${gameType.is_adult}`)
//     console.log(`   - Has Spice Meter: ${gameType.has_spice_meter}`)

//     // Age Gate Check
//     if (gameType.is_adult && minCoupleAge < 18) {
//       console.log('⛔ Age restriction triggered - blocking access')
//       return new Response(JSON.stringify({ error: 'Age restricted content' }), { 
//         status: 403,
//         headers: { 'Content-Type': 'application/json' }
//       })
//     }
//     console.log('✅ Age gate passed')

//     // 4. Fetch Seen History
//     console.log('----------------------------------------------------')
//     console.log('👀 [Step 4] Fetching seen prompt history...')
//     const seenFetchStart = Date.now()
//     const { data: seenData, error: seenError } = await supabase
//       .from('bond_seen_prompts')
//       .select('prompt_id')
//       .eq('bond_id', bond_id)
//       .eq('type', 'game')

//     console.log(`   Query took: ${Date.now() - seenFetchStart}ms`)

//     if (seenError) {
//       console.warn('⚠️ Error fetching seen prompts (continuing anyway):', seenError)
//     }

//     const seenIds = seenData?.map((r: any) => r.prompt_id) || [];
//     console.log(`✅ Bond has seen ${seenIds.length} prompts previously`)

//     // 5. Global Pool Search
//     console.log('----------------------------------------------------')
//     console.log('📚 [Step 5] Searching global prompt pool...')
//     console.log(`   Filters:`)
//     console.log(`   - game_type_id: ${gameType.id}`)
//     console.log(`   - mode IN: [${mode}, 'both']`)
//     if (gameType.has_spice_meter) {
//       console.log(`   - heat_level: ${heat_level}`)
//     }
//     console.log(`   - Excluding ${seenIds.length} seen prompts`)

//     const poolFetchStart = Date.now()
//     let query = supabase
//       .from('game_prompts')
//       .select('id, prompt_text, option_a, option_b')
//       .eq('game_type_id', gameType.id)
//       .in('mode', [mode, 'both'])
    
//     if (gameType.has_spice_meter) {
//       query = query.eq('heat_level', heat_level)
//     }

//     if (seenIds.length > 0) {
//       query = query.not('id', 'in', `(${seenIds.join(',')})`)
//     }

//     const { data: existingCandidates, error: poolError } = await query.limit(count);

//     console.log(`   Query took: ${Date.now() - poolFetchStart}ms`)

//     if (poolError) {
//       console.error('❌ Pool fetch error:', poolError)
//     }

//     let finalPrompts = existingCandidates || [];
//     console.log(`✅ Found ${finalPrompts.length} existing valid prompts in Global Pool`)

//     // 6. AI Generation (if pool is insufficient)
//     console.log('----------------------------------------------------')
//     console.log('🤖 [Step 6] AI Generation check...')
//     console.log(`   Requested: ${count}, Available: ${finalPrompts.length}`)

//     if (finalPrompts.length < count) {
//       const needed = count - finalPrompts.length;
//       console.log(`⚠️ Pool insufficient! Need ${needed} more prompts.`)
//       console.log(`🚀 Triggering AI generation for ${AI_BATCH_SIZE} new prompts...`)

//       const promptTemplate = GAME_PROMPTS[game_type_slug];
//       if (!promptTemplate) {
//         console.warn(`⚠️ No prompt template found for game type: ${game_type_slug}`)
//         console.log('   Available templates:', Object.keys(GAME_PROMPTS).join(', '))
//       } else {
//         const systemPrompt = promptTemplate(heat_level, mode, bond.dynamic);
//         console.log(`📝 Generated system prompt (first 200 chars):`)
//         console.log(`   "${systemPrompt.substring(0, 200)}..."`)
        
//         console.log('----------------------------------------------------')
//         console.log('📡 [Step 6a] Calling Gemini API...')
//         console.log(`   URL: ${GEMINI_API_URL}`)
        
//         const geminiStart = Date.now()
//         try {
//           const geminiResponse = await fetch(GEMINI_API_URL, {
//             method: 'POST',
//             headers: { 
//               'Content-Type': 'application/json',
//               'x-goog-api-key': GEMINI_API_KEY,
//             },
//             body: JSON.stringify({
//               contents: [{ parts: [{ text: systemPrompt }] }],
//               generationConfig: { temperature: 0.9 }
//             })
//           });

//           const geminiDuration = Date.now() - geminiStart
//           console.log(`   API call took: ${geminiDuration}ms`)
//           console.log(`   Response Status: ${geminiResponse.status} ${geminiResponse.statusText}`)

//           if (geminiResponse.ok) {
//             const geminiData = await geminiResponse.json();
//             console.log('✅ Gemini API responded successfully')
            
//             // Check response structure
//             const candidate = geminiData.candidates?.[0];
//             if (!candidate) {
//               console.error('❌ No candidates in response!')
//               console.log('   Full response:', JSON.stringify(geminiData).substring(0, 500))
//             } else {
//               const text = candidate.content?.parts?.[0]?.text || '';
//               console.log(`📄 Response text length: ${text.length} characters`)
//               console.log(`   First 100 chars: "${text.substring(0, 100)}..."`)
//               console.log(`   Last 100 chars: "...${text.substring(text.length - 100)}"`)
              
//               // Check for safety blocks
//               if (candidate.finishReason === 'SAFETY') {
//                 console.error('⛔ Response blocked by safety filters!')
//                 console.log('   Safety ratings:', JSON.stringify(candidate.safetyRatings))
//               }

//               // Parse JSON
//               console.log('🔄 [Step 6b] Parsing AI response...')
//               try {
//                 const jsonMatch = text.match(/\[[\s\S]*\]/);
//                 if (jsonMatch) {
//                   const rawPrompts = JSON.parse(jsonMatch[0]);
//                   console.log(`✅ Successfully parsed ${rawPrompts.length} prompts from AI`)
                  
//                   // Save to database
//                   console.log('💾 [Step 6c] Saving AI prompts to database...')
//                   let savedCount = 0;
//                   let duplicateCount = 0;
//                   let errorCount = 0;

//                   for (const p of rawPrompts) {
//                     const promptText = p.prompt || p.question || p.dare || `${p.optionA} OR ${p.optionB}`;
//                     const optA = p.optionA || null;
//                     const optB = p.optionB || null;

//                     const newPrompt = {
//                       game_type_id: gameType.id,
//                       prompt_text: promptText,
//                       option_a: optA,
//                       option_b: optB,
//                       mode: mode === 'virtual' ? 'virtual' : 'both',
//                       heat_level: gameType.has_spice_meter ? heat_level : 1,
//                       dynamic: bond.dynamic ? [bond.dynamic] : [],
//                       min_age: gameType.is_adult ? 18 : 0,
//                       is_seed: false
//                     };

//                     const { data: saved, error: insertError } = await supabase
//                       .from('game_prompts')
//                       .insert(newPrompt)
//                       .select()
//                       .single();

//                     if (saved) {
//                       finalPrompts.push(saved);
//                       savedCount++;
//                     } else if (insertError) {
//                       if (insertError.code === '23505') { // Unique constraint violation
//                         duplicateCount++;
//                       } else {
//                         errorCount++;
//                         console.log(`   ⚠️ Insert error: ${insertError.message}`);
//                       }
//                     }
//                   }

//                   console.log(`✅ Database save complete:`)
//                   console.log(`   - Saved: ${savedCount}`)
//                   console.log(`   - Duplicates skipped: ${duplicateCount}`)
//                   console.log(`   - Errors: ${errorCount}`)
//                   console.log(`   - Total prompts now: ${finalPrompts.length}`)

//                 } else {
//                   console.error('❌ Could not find JSON array in response!')
//                   console.log('   Raw text:', text)
//                 }
//               } catch (parseError) {
//                 console.error('❌ JSON Parse Error:', parseError)
//                 console.log('   Raw text was:', text)
//               }
//             }
//           } else {
//             const errText = await geminiResponse.text();
//             console.error(`❌ Gemini API Error!`)
//             console.error(`   Status: ${geminiResponse.status} ${geminiResponse.statusText}`)
//             console.error(`   Response body: ${errText}`)
//           }
//         } catch (fetchError) {
//           console.error('❌ Gemini Fetch Error (network/timeout):', fetchError)
//         }
//       }
//     } else {
//       console.log('✅ Pool has sufficient prompts, skipping AI generation')
//     }

//     // 7. Prepare Response
//     console.log('----------------------------------------------------')
//     console.log('🎲 [Step 7] Preparing final response...')
//     const shuffled = finalPrompts.sort(() => 0.5 - Math.random()).slice(0, count);
//     console.log(`   Shuffled and sliced to ${shuffled.length} prompts`)

//     // 8. Track as Seen
//     console.log('----------------------------------------------------')
//     console.log('📝 [Step 8] Tracking prompts as seen...')
//     if (shuffled.length > 0) {
//       const seenEntries = shuffled.map(p => ({
//         bond_id: bond_id,
//         prompt_id: p.id,
//         type: 'game'
//       }));
      
//       const { error: seenInsertError } = await supabase.from('bond_seen_prompts').insert(seenEntries);
//       if (seenInsertError) {
//         console.error('⚠️ Error tracking seen prompts:', seenInsertError)
//       } else {
//         console.log(`✅ Marked ${shuffled.length} prompts as seen for this bond`)
//       }
//     } else {
//       console.log('⚠️ No prompts to mark as seen')
//     }

//     // Final Summary
//     const totalDuration = Date.now() - startTime
//     console.log('====================================================')
//     console.log('🏁 [COMPLETE] Function execution finished')
//     console.log(`   Total Duration: ${totalDuration}ms`)
//     console.log(`   Prompts Returned: ${shuffled.length}`)
//     console.log('====================================================')

//     return new Response(
//       JSON.stringify({ 
//         prompts: shuffled, 
//         count: shuffled.length 
//       }),
//       { headers: { 'Content-Type': 'application/json' } }
//     )

//   } catch (error) {
//     const totalDuration = Date.now() - startTime
//     console.error('====================================================')
//     console.error('🔥 [CRITICAL ERROR] Function failed!')
//     console.error(`   Message: ${error.message}`)
//     console.error(`   Stack: ${error.stack}`)
//     console.error(`   Total Duration: ${totalDuration}ms`)
//     console.error('====================================================')
    
//     return new Response(JSON.stringify({ 
//       error: error.message,
//       prompts: [],
//       count: 0
//     }), { 
//       status: 500,
//       headers: { 'Content-Type': 'application/json' }
//     })
//   }
// })
