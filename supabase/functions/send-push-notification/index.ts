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

//     const { user_id, title, body, data } = await req.json();

//     // 1. Get Push Token
//     const { data: profile } = await supabase
//       .from('profiles')
//       .select('push_token')
//       .eq('id', user_id)
//       .single();

//     if (!profile?.push_token) {
//       return new Response(JSON.stringify({ message: "No push token found" }), {
//         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//       });
//     }

//     // 2. Send to Expo
//     const message = {
//       to: profile.push_token,
//       sound: 'default',
//       title: title || "Mistie",
//       body: body || "",
//       data: data || {},
//     };

//     const res = await fetch('https://exp.host/--/api/v2/push/send', {
//       method: 'POST',
//       headers: {
//         'Accept': 'application/json',
//         'Accept-encoding': 'gzip, deflate',
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(message),
//     });

//     const result = await res.json();

//     return new Response(JSON.stringify(result), {
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//     });

//   } catch (error) {
//     return new Response(JSON.stringify({ error: error.message }), {
//       status: 400,
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//     });
//   }
// });
