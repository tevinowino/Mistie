import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userIds: string[];
  title: string;
  body: string;
  data?: any;
  type: 'daily_dew' | 'nug' | 'game_invite' | 'bond_request' | 'system' | 'reminder';
  actorId?: string; 
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userIds, title, body, data, type, actorId }: NotificationRequest = await req.json();

    if (!userIds || !userIds.length) {
      throw new Error('No userIds provided');
    }

    // 1. Fetch Push Tokens (Only if notifications_enabled is TRUE or null/undefined)
    // Using .or() to handle cases where notifications_enabled might not exist or is null
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, push_token, notifications_enabled')
      .in('id', userIds)
      .not('push_token', 'is', null);

    if (profileError) throw profileError;

    // Filter: Only send push if notifications_enabled is true or undefined (default to enabled)
    const enabledProfiles = profiles?.filter(p => p.notifications_enabled !== false) || [];

    // 2. Send to Expo
    const messages = enabledProfiles.map(profile => ({
      to: profile.push_token,
      sound: 'default',
      title,
      body,
      data: { ...(data || {}), type }
    }));

    if (messages.length > 0) {
      console.log(`📤 [send-push] Sending ${messages.length} push notifications...`);
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

    // 3. Log to Database (Notifications History)
    // ALWAYS insert into history, even if push is disabled.
    // The user might want to see them in the "Notifications" tab later.
    const notificationRows = userIds.map(uid => ({
      user_id: uid,
      actor_id: actorId || null,
      type,
      title,
      body,
      data: data || {},
      is_read: false
    }));

    const { error: insertError } = await supabase
        .from('notifications')
        .insert(notificationRows);

    if (insertError) {
      console.error('❌ [send-push] Error inserting notifications:', insertError);
      // Don't throw, push was already sent
    }

    console.log(`✅ [send-push] Done. Sent ${messages.length} push, logged ${notificationRows.length} records.`);

    return new Response(JSON.stringify({ success: true, count: messages.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [send-push] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
