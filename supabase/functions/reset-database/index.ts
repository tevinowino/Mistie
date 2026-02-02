
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

//     // Optional: Add simple security check (e.g., require a specific header or just be open for this test)
//     // For now, we'll assume the user knows what they are doing since they deployed it.

//     // 1. Delete Child Tables first to avoid constraint issues if cascade isn't perfect
//     await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
//     await supabase.from('nugs').delete().neq('id', 0);
//     await supabase.from('daily_dews').delete().neq('id', 0);
//     await supabase.from('game_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
//     await supabase.from('bond_seen_prompts').delete().neq('id', 0); 

//     // 2. Delete Bonds
//     await supabase.from('bonds').delete().neq('id', '00000000-0000-0000-0000-000000000000');

//     // 3. Reset Profiles (Keep the rows, but clear personal data)
//     const { error: profileError } = await supabase
//       .from('profiles')
//       .update({
//         is_onboarding_complete: false,
//         birth_date: null,
//         gender: null,
//         display_name: null
//       })
//       .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

//     if (profileError) throw profileError;

//     return new Response(JSON.stringify({ message: "Database reset successfully" }), {
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//     });

//   } catch (error) {
//     return new Response(JSON.stringify({ error: error.message }), {
//       status: 400,
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//     });
//   }
// });
