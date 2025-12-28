// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// };

// interface NotificationRequest {
//   userIds: string[];
//   title: string;
//   body: string;
//   data?: any;
//   type: 'daily_dew' | 'nug' | 'game_invite' | 'bond_request' | 'system' | 'reminder';
//   actorId?: string; // Optional: who triggered it
// }

// serve(async (req) => {
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { headers: corsHeaders });
//   }

//   try {
//     const supabase = createClient(
//       Deno.env.get('SUPABASE_URL') ?? '',
//       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
//     );

//     const { userIds, title, body, data, type, actorId }: NotificationRequest = await req.json();

//     if (!userIds || !userIds.length) {
//       throw new Error('No userIds provided');
//     }

//     // 1. Fetch Push Tokens
//     const { data: profiles, error: profileError } = await supabase
//       .from('profiles')
//       .select('id, push_token')
//       .in('id', userIds)
//       .not('push_token', 'is', null);

//     if (profileError) throw profileError;

//     // 2. Send to Expo
//     const messages = profiles?.map(profile => ({
//       to: profile.push_token,
//       sound: 'default',
//       title,
//       body,
//       data: { ...(data || {}), type } // Embed type in data for easier handling
//     })) || [];

//     if (messages.length > 0) {
//       // Setup chunks if needed (Expo handles batches of 100), for now assume <100
//       await fetch('https://exp.host/--/api/v2/push/send', {
//         method: 'POST',
//         headers: {
//           'Accept': 'application/json',
//           'Accept-encoding': 'gzip, deflate',
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(messages),
//       });
//       // We don't block on waiting for Expo receipts here for speed
//     }

//     // 3. Log to Database (Notifications History)
//     // We insert a row for EVERY recipient, regardless of whether they had a token
//     // (So the in-app feed works even if push is disabled/missing)
//     const notificationRows = userIds.map(uid => ({
//       user_id: uid,
//       actor_id: actorId || null,
//       type,
//       title,
//       body,
//       data: data || {},
//       is_read: false
//     }));

//     const { error: insertError } = await supabase
//         .from('notifications')
//         .insert(notificationRows);

//     if (insertError) throw insertError;

//     return new Response(JSON.stringify({ success: true, count: messages.length }), {
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//     });

//   } catch (error) {
//     return new Response(JSON.stringify({ error: error.message }), {
//       status: 400,
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//     });
//   }
// });
