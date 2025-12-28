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

//     console.log("Checking anniversaries for today...");

//     // 1. Fetch Bonds
//     const { data: bonds, error: bondsError } = await supabase
//         .from('bonds')
//         .select(`
//             id,
//             anniversary_date,
//             user_1_id,
//             user_2_id,
//             user_1:profiles!bonds_user_1_id_fkey(push_token, display_name),
//             user_2:profiles!bonds_user_2_id_fkey(push_token, display_name)
//         `)
//         .eq('status', 'couple')
//         .not('anniversary_date', 'is', null);

//     if (bondsError) throw bondsError;

//     const today = new Date();
//     const currentMonth = today.getMonth() + 1; // 0-indexed
//     const currentDay = today.getDate();

//     const celebratingBonds = bonds.filter(bond => {
//         if (!bond.anniversary_date) return false;
//         // Correct for timezone if needed, but assuming stored as YYYY-MM-DD string helps.
//         const [y, m, d] = bond.anniversary_date.split('-').map(Number);
//         return m === currentMonth && d === currentDay;
//     });

//     console.log(`Found ${celebratingBonds.length} anniversaries today.`);

//     const messages = [];
//     const notifications = [];

//     for (const bond of celebratingBonds) {
//         // Calculate years
//         const startYear = parseInt(bond.anniversary_date.split('-')[0]);
//         const years = today.getFullYear() - startYear;
//         const title = "Happy Anniversary! 🎉";
//         const body = `Celebrating ${years} year${years === 1 ? '' : 's'} of love! Check the app for a special memory.`;

//         // User 1
//         if (bond.user_1?.push_token) {
//             messages.push({
//                 to: bond.user_1.push_token,
//                 sound: 'default',
//                 title,
//                 body,
//                 data: { type: 'anniversary', bondId: bond.id }
//             });
//         }
//         notifications.push({
//             user_id: bond.user_1_id,
//             type: 'system', // or anniversary
//             title,
//             body,
//             data: { type: 'anniversary', years }
//         });

//         // User 2
//         if (bond.user_2?.push_token) {
//             messages.push({
//                 to: bond.user_2.push_token,
//                 sound: 'default',
//                 title,
//                 body,
//                 data: { type: 'anniversary', bondId: bond.id }
//             });
//         }
//         notifications.push({
//             user_id: bond.user_2_id,
//             type: 'system',
//             title,
//             body,
//             data: { type: 'anniversary', years }
//         });
//     }

//     // 2. Send Push
//     if (messages.length > 0) {
//         await fetch('https://exp.host/--/api/v2/push/send', {
//         method: 'POST',
//         headers: {
//             'Accept': 'application/json',
//             'Accept-encoding': 'gzip, deflate',
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(messages),
//         });
//     }

//     // 3. Log Notifications
//     if (notifications.length > 0) {
//         await supabase.from('notifications').insert(notifications);
//     }

//     return new Response(JSON.stringify({ 
//         success: true, 
//         processed: bonds.length, 
//         celebrating: celebratingBonds.length 
//     }), {
//         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//     });

//   } catch (error) {
//     return new Response(JSON.stringify({ error: error.message }), {
//       status: 400,
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//     });
//   }
// });
