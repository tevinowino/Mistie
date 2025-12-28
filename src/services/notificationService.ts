import { supabase } from '../lib/supabase';

type NotificationType = 'daily_dew' | 'nug' | 'game_invite' | 'bond_request' | 'system' | 'reminder';

interface SendNotificationParams {
  userIds: string[];
  title: string;
  body: string;
  data?: any;
  type: NotificationType;
  actorId?: string;
}

export const notificationService = {
  /**
   * Triggers a push notification via the 'send-push' Edge Function.
   */
  async send({ userIds, title, body, data, type, actorId }: SendNotificationParams) {
    try {
      // Get the session to pass the user's JWT
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch('https://eadkkxsqjoutwtmovtpc.supabase.co/functions/v1/send-push', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds,
          title,
          body,
          data,
          type,
          actorId,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Error sending notification via fetch:', responseData);
        return { error: responseData };
      }

      return { data: responseData };
    } catch (err) {
      console.error('Unexpected error in notificationService.send:', err);
      return { error: err };
    }
  },

  /**
   * Helper: Send a Nug notification
   */
  async notifyNugReceived(recipientId: string, senderName: string) {
    return this.send({
      userIds: [recipientId],
      title: 'New Nug! 🐤',
      body: `${senderName} sent you a Nug!`,
      type: 'nug',
      data: { route: '/(tabs)/nugs-history' } // Or open modal?
    });
  },

  /**
   * Helper: Send Dew Revealed notification
   */
  async notifyDewRevealed(recipientId: string, partnerName: string) {
    return this.send({
      userIds: [recipientId],
      title: 'Daily Dew Revealed ✨',
      body: `See what ${partnerName} answered!`,
      type: 'daily_dew',
      data: { route: '/(tabs)/dew' }
    });
  },
  
  /**
   * Helper: Send Dew Waiting notification
   */
  async notifyDewWaiting(recipientId: string, partnerName: string) {
    return this.send({
      userIds: [recipientId],
      title: 'Your Turn! 👀',
      body: `${partnerName} answered the Daily Dew. Answer to reveal results!`,
      type: 'daily_dew',
      data: { route: '/(tabs)/dew' }
    });
  }
};
