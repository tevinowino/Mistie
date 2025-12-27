// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// };

// serve(async (req) => {
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { headers: corsHeaders });
//   }

//   try {
//     const supabase = createClient(
//       Deno.env.get('SUPABASE_URL') ?? '',
//       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
//     );

//     const { bond_id, heat_level } = await req.json();

//     // 1. Fetch Intimacy Maps for BOTH users
//     const { data: bond } = await supabase
//       .from('bonds')
//       .select('user_1_id, user_2_id')
//       .eq('id', bond_id)
//       .single();
    
//     if (!bond) throw new Error("Bond not found");

//     const { data: maps } = await supabase
//       .from('intimacy_maps')
//       .select('preferences')
//       .in('user_id', [bond.user_1_id, bond.user_2_id]);

//     // Simple Intersection Logic (Placeholder)
//     // In production, you'd deeply merge the JSON preferences to find common "allow lists"
    
//     // 2. Call Gemini
//     const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
//     const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

//     const prompt = `
//       You are the Wildfire Game Master.
//       Heat Level: ${heat_level || 'flicker'} (Scale: flicker=shy, molten=extreme).
//       Task: Generate 5 dares for a couple to play.
//       Constraint: Respect mutual consent. Keep it short (max 10 words per dare).
//       Output: JSON Array of strings.
//     `;

//     const response = await fetch(url, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         contents: [{ parts: [{ text: prompt }] }]
//       })
//     });

//     const data = await response.json();
//     let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    
//     // Cleanup markdown block if present
//     text = text.replace(/```json/g, '').replace(/```/g, '').trim();
//     const dares = JSON.parse(text);

//     return new Response(JSON.stringify({ dares }), {
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//     });

//   } catch (error) {
//     return new Response(JSON.stringify({ error: error.message }), {
//       status: 400,
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//     });
//   }
// });
