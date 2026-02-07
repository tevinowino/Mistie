// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// };

// /**
//  * check-daily-dew: Scheduled Edge Function
//  * Runs daily at ~8 PM to remind users who haven't answered the Daily Dew.
//  * This helps preserve streaks.
//  */
// serve(async (req) => {
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { headers: corsHeaders });
//   }

//   try {
//     const supabase = createClient(
//       Deno.env.get('SUPABASE_URL') ?? '',
//       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
//     );

//     console.log("🔔 [check-daily-dew] Running Daily Dew reminder check...");

//     const today = new Date().toISOString().split('T')[0];

//     // 1. Fetch today's dews with bond and profile data
//     const { data: dews, error: dewError } = await supabase
//       .from('daily_dews')
//       .select(`
//         id,
//         question_text,
//         user_1_response,
//         user_2_response,
//         bond:bonds!daily_dews_bond_id_fkey(
//           id,
//           streak_count,
//           user_1_id,
//           user_2_id,
//           user_1_profile:profiles!bonds_user_1_id_fkey(id, push_token, display_name, notifications_enabled),
//           user_2_profile:profiles!bonds_user_2_id_fkey(id, push_token, display_name, notifications_enabled)
//         )
//       `)
//       .eq('scheduled_for', today)
//       .eq('is_revealed', false);

//     if (dewError) throw dewError;

//     if (!dews || dews.length === 0) {
//       console.log("✅ [check-daily-dew] No incomplete dews for today.");
//       return new Response(JSON.stringify({ message: 'No reminders needed' }), {
//         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//       });
//     }

//     console.log(`📬 [check-daily-dew] Found ${dews.length} incomplete dews.`);

//     const messages: any[] = [];
//     const notifications: any[] = [];

//     for (const dew of dews) {
//       const bond = dew.bond as any;
//       if (!bond) continue;

//       const streak = bond.streak_count || 0;
//       const user1Profile = bond.user_1_profile;
//       const user2Profile = bond.user_2_profile;
      
//       const user1Name = user1Profile?.display_name || 'Your love';
//       const user2Name = user2Profile?.display_name || 'Your love';

//       // CASE 1: Neither has answered - remind both
//       if (!dew.user_1_response && !dew.user_2_response) {
//         // Remind User 1
//         if (user1Profile?.notifications_enabled !== false && user1Profile?.push_token) {
//           const title = streak > 0 ? 'Keep Your Streak Alive! 🔥' : "Time for today's Dew! 💧";
//           const body = streak > 0 
//             ? `You and ${user2Name} are on a ${streak}-day streak! Don't let it break.`
//             : `Share your thoughts with ${user2Name} today.`;
          
//           messages.push({
//             to: user1Profile.push_token,
//             sound: 'default',
//             title,
//             body,
//             data: { type: 'dew_reminder', route: '/(tabs)/dew' }
//           });
//           notifications.push({
//             user_id: user1Profile.id,
//             type: 'dew_reminder',
//             title,
//             body,
//             data: { route: '/(tabs)/dew' }
//           });
//         }

//         // Remind User 2
//         if (user2Profile?.notifications_enabled !== false && user2Profile?.push_token) {
//           const title = streak > 0 ? 'Keep Your Streak Alive! 🔥' : "Time for today's Dew! 💧";
//           const body = streak > 0 
//             ? `You and ${user1Name} are on a ${streak}-day streak! Don't let it break.`
//             : `Share your thoughts with ${user1Name} today.`;
          
//           messages.push({
//             to: user2Profile.push_token,
//             sound: 'default',
//             title,
//             body,
//             data: { type: 'dew_reminder', route: '/(tabs)/dew' }
//           });
//           notifications.push({
//             user_id: user2Profile.id,
//             type: 'dew_reminder',
//             title,
//             body,
//             data: { route: '/(tabs)/dew' }
//           });
//         }
//       }
      
//       // CASE 2: User 1 answered, User 2 hasn't - remind User 2 that partner is waiting
//       else if (dew.user_1_response && !dew.user_2_response) {
//         if (user2Profile?.notifications_enabled !== false && user2Profile?.push_token) {
//           const title = `${user1Name} is waiting for you! 💬`;
//           const body = streak > 0 
//             ? `Answer today's Dew to keep your ${streak}-day streak!`
//             : `${user1Name} already answered. Your turn to share!`;
          
//           messages.push({
//             to: user2Profile.push_token,
//             sound: 'default',
//             title,
//             body,
//             data: { type: 'dew_waiting', route: '/(tabs)/dew' }
//           });
//           notifications.push({
//             user_id: user2Profile.id,
//             type: 'dew_waiting',
//             title,
//             body,
//             data: { route: '/(tabs)/dew' }
//           });
//         }
//       }
      
//       // CASE 3: User 2 answered, User 1 hasn't - remind User 1 that partner is waiting
//       else if (!dew.user_1_response && dew.user_2_response) {
//         if (user1Profile?.notifications_enabled !== false && user1Profile?.push_token) {
//           const title = `${user2Name} is waiting for you! 💬`;
//           const body = streak > 0 
//             ? `Answer today's Dew to keep your ${streak}-day streak!`
//             : `${user2Name} already answered. Your turn to share!`;
          
//           messages.push({
//             to: user1Profile.push_token,
//             sound: 'default',
//             title,
//             body,
//             data: { type: 'dew_waiting', route: '/(tabs)/dew' }
//           });
//           notifications.push({
//             user_id: user1Profile.id,
//             type: 'dew_waiting',
//             title,
//             body,
//             data: { route: '/(tabs)/dew' }
//           });
//         }
//       }
//     }

//     // 2. Send Push Notifications
//     if (messages.length > 0) {
//       console.log(`📤 [check-daily-dew] Sending ${messages.length} push notifications...`);
//       await fetch('https://exp.host/--/api/v2/push/send', {
//         method: 'POST',
//         headers: {
//           'Accept': 'application/json',
//           'Accept-encoding': 'gzip, deflate',
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(messages),
//       });
//     }

//     // 3. Log Notifications to DB
//     if (notifications.length > 0) {
//       await supabase.from('notifications').insert(notifications);
//     }

//     console.log(`✅ [check-daily-dew] Done. Sent ${messages.length} push, logged ${notifications.length} records.`);

//     return new Response(JSON.stringify({ 
//       success: true, 
//       pushSent: messages.length, 
//       logged: notifications.length 
//     }), {
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//     });

//   } catch (error) {
//     console.error("❌ [check-daily-dew] Error:", error);
//     return new Response(JSON.stringify({ error: error.message }), {
//       status: 500,
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//     });
//   }
// });
