import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * check-birthdays: Scheduled Edge Function
 * Runs daily at ~9 AM to notify partners about birthdays.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log("🎂 [check-birthdays] Running birthday check...");

    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 0-indexed
    const currentDay = today.getDate();

    // 1. Fetch all profiles with birth_date set
    // We need to join with bonds to find the partner
    const { data: bonds, error: bondsError } = await supabase
      .from('bonds')
      .select(`
        id,
        user_1_id,
        user_2_id,
        user_1_profile:profiles!bonds_user_1_id_fkey(id, display_name, birth_date, push_token, notifications_enabled),
        user_2_profile:profiles!bonds_user_2_id_fkey(id, display_name, birth_date, push_token, notifications_enabled)
      `)
      .eq('status', 'couple');

    if (bondsError) throw bondsError;

    if (!bonds || bonds.length === 0) {
      console.log("✅ [check-birthdays] No active bonds found.");
      return new Response(JSON.stringify({ message: 'No bonds to check' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔍 [check-birthdays] Checking ${bonds.length} bonds...`);

    const messages: any[] = [];
    const notifications: any[] = [];

    for (const bond of bonds) {
      const u1 = bond.user_1_profile as any;
      const u2 = bond.user_2_profile as any;

      // Check if User 1's birthday is today -> Notify User 2
      if (u1?.birth_date) {
        const [y, m, d] = u1.birth_date.split('-').map(Number);
        if (m === currentMonth && d === currentDay) {
          const birthdayPersonName = u1.display_name || 'Your Partner';
          const title = `It's ${birthdayPersonName}'s Birthday! 🎂`;
          const body = `Don't forget to wish them a happy birthday!`;

          if (u2?.notifications_enabled !== false && u2?.push_token) {
            messages.push({
              to: u2.push_token,
              sound: 'default',
              title,
              body,
              data: { type: 'birthday' }
            });
          }
          if (u2?.id) {
            notifications.push({
              user_id: u2.id,
              type: 'system',
              title,
              body,
              data: { type: 'birthday', birthdayUserId: u1.id }
            });
          }
        }
      }

      // Check if User 2's birthday is today -> Notify User 1
      if (u2?.birth_date) {
        const [y, m, d] = u2.birth_date.split('-').map(Number);
        if (m === currentMonth && d === currentDay) {
          const birthdayPersonName = u2.display_name || 'Your Partner';
          const title = `It's ${birthdayPersonName}'s Birthday! 🎂`;
          const body = `Don't forget to wish them a happy birthday!`;

          if (u1?.notifications_enabled !== false && u1?.push_token) {
            messages.push({
              to: u1.push_token,
              sound: 'default',
              title,
              body,
              data: { type: 'birthday' }
            });
          }
          if (u1?.id) {
            notifications.push({
              user_id: u1.id,
              type: 'system',
              title,
              body,
              data: { type: 'birthday', birthdayUserId: u2.id }
            });
          }
        }
      }
    }

    // 2. Send Push Notifications
    if (messages.length > 0) {
      console.log(`📤 [check-birthdays] Sending ${messages.length} push notifications...`);
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
    }

    // 3. Log Notifications to DB
    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }

    console.log(`✅ [check-birthdays] Done. Sent ${messages.length} push, logged ${notifications.length} records.`);

    return new Response(JSON.stringify({ 
      success: true, 
      pushSent: messages.length, 
      logged: notifications.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("❌ [check-birthdays] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
