// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
// const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// const supabase = createClient(supabaseUrl, serviceRoleKey);

// Deno.serve(async (req) => {
//   try {
//     console.log('Starting streak check...');

//     // Logic: Find bonds where last_activity is older than ~30 hours (giving a little buffer over 24h)
//     // AND where streak_count > 0
    
//     // 30 hours ago
//     const cutoffDate = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();

//     const { data: brokenBonds, error: fetchError } = await supabase
//       .from('bonds')
//       .select('id, streak_count, last_activity')
//       .gt('streak_count', 0)
//       .lt('last_activity', cutoffDate);

//     if (fetchError) throw fetchError;

//     if (!brokenBonds || brokenBonds.length === 0) {
//       console.log('No broken streaks found.');
//       return new Response(JSON.stringify({ message: 'No broken streaks found' }), {
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     console.log(`Found ${brokenBonds.length} broken streaks. Resetting...`);

//     const idsToReset = brokenBonds.map(b => b.id);

//     const { error: updateError } = await supabase
//       .from('bonds')
//       .update({ streak_count: 0 })
//       .in('id', idsToReset);

//     if (updateError) throw updateError;

//     console.log('Streaks reset successfully.');

//     return new Response(JSON.stringify({ 
//       message: `Reset ${brokenBonds.length} broken streaks`, 
//       ids: idsToReset 
//     }), {
//       headers: { 'Content-Type': 'application/json' },
//     });

//   } catch (error) {
//     console.error('Error checking streaks:', error);
//     return new Response(JSON.stringify({ error: error.message }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }
// });
