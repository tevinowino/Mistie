import { supabase } from '../lib/supabase';
import { notificationService } from './notificationService';

// Generate a random 6-digit code
const generateBondCode = () => {
  return Math.random().toString().slice(2, 8); 
};

export const bondService = {
  // Check if user is already in a bond (includes profile data for both users)
  async getUserBond(userId: string) {
    // Prioritize 'couple' bonds over 'pending', just in case duplicates exist
    const { data, error } = await supabase
      .from('bonds')
      .select(`
        *,
        dynamic,
        is_onboarding_complete,
        anniversary_date,
        user_1_profile:profiles!bonds_user_1_id_fkey(id, display_name, avatar_url, birth_date),
        user_2_profile:profiles!bonds_user_2_id_fkey(id, display_name, avatar_url, birth_date)
      `)
      .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
      .order('status', { ascending: true }) // 'couple' comes before 'pending' alphabetically
      .limit(1)
      .maybeSingle();
    
    return { data, error };
  },

  // User A creates the bond
  async createPendingBond(userId: string) {
    // 1. Safety check: Don't create if already exists
    const { data: existing } = await this.getUserBond(userId);
    if (existing) {
      return { data: existing, error: null };
    }

    // 2. Try to create with unique code (retry up to 3 times)
    let attempts = 0;
    while (attempts < 3) {
      const code = generateBondCode();
      const { data, error } = await supabase
        .from('bonds')
        .insert({
          user_1_id: userId,
          status: 'pending',
          connection_code: code,
        })
        .select()
        .single();

      if (!error && data) {
        return { data, error: null };
      }

      // If error is NOT a uniqueness violation (23505), fail immediately
      if (error && error.code !== '23505') {
        return { data: null, error };
      }
      
      attempts++;
    }

    return { data: null, error: new Error("Failed to generate unique code after 3 attempts") };
  },

  // User B joins via code
  async joinBond(userId: string, code: string) {
    // 0. Safety: Delete ANY pending bonds where I am the initiator
    // This prevents me from having a "dangling" invitation while I join someone else.
    await supabase
      .from('bonds')
      .delete()
      .eq('user_1_id', userId)
      .eq('status', 'pending');

    // 1. Find bond by code
    const { data: bond, error: fetchError } = await supabase
      .from('bonds')
      .select('*')
      .eq('connection_code', code)
      .eq('status', 'pending')
      .single();

    if (fetchError || !bond) {
      return { error: 'Invalid or expired code.' };
    }

    if (bond.user_1_id === userId) {
      return { error: "You cannot join your own bond." };
    }

    // 2. Update bond
    const { data: updated, error: updateError } = await supabase
      .from('bonds')
      .update({
        user_2_id: userId,
        status: 'couple',
        connection_code: null, // Clear code
        is_active: true
      })
      .eq('id', bond.id)
      .select()
      .single();

    return { data: updated, error: updateError };
  },

  // Update bond details (e.g. dynamic, onboarding status)
  async updateBond(bondId: string, updates: any) {
    const { data, error } = await supabase
      .from('bonds')
      .update(updates)
      .eq('id', bondId)
      .select()
      .single();
    
    return { data, error };
  },

  // --- DAILY DEW METHODS ---

  async getTodayDew(bondId: string) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_dews')
      .select('*')
      .eq('bond_id', bondId)
      .eq('scheduled_for', today)
      .maybeSingle();

    return { data, error };
  },

  async answerDailyDew(dewId: string, answer: string, isUser1: boolean) {
    // 1. Update the user's response
    const updatePayload = isUser1 
      ? { user_1_response: answer }
      : { user_2_response: answer };

    const { data: updatedDew, error } = await supabase
      .from('daily_dews')
      .update(updatePayload)
      .eq('id', dewId)
      .select()
      .single();

    if (error || !updatedDew) return { data: null, error };

    // 2. Check if both have answered to reveal
    if (updatedDew.user_1_response && updatedDew.user_2_response && !updatedDew.is_revealed) {
      // Reveal the dew
      const { data: revealedDew, error: revealError } = await supabase
        .from('daily_dews')
        .update({ is_revealed: true })
        .eq('id', dewId)
        .select()
        .single();

      // STREAK managed by Database Trigger (handle_dew_completion)
        
      // NOTIFICATION: Dew Revealed
      // We still want to notify the partner that the dew was revealed
      const { data: bond } = await supabase
        .from('bonds')
        .select('user_1_id, user_2_id, streak_count')
        .eq('id', updatedDew.bond_id)
        .single();
      
      if (bond) {
        const partnerId = isUser1 ? bond.user_2_id : bond.user_1_id;
        const myId = isUser1 ? bond.user_1_id : bond.user_2_id;
        if (partnerId && myId) {
            // Get my name
            const { data: myProfile } = await supabase.from('profiles').select('display_name').eq('id', myId).single();
            const myName = myProfile?.display_name || 'Your partner';
              // Notify partner
            await notificationService.notifyDewRevealed(partnerId, myName);

            // MILESTONE CHECK: Notify both if hitting a streak milestone
            const milestones = [3, 5, 10, 20, 50, 100, 200, 365];
            if (bond.streak_count && milestones.includes(bond.streak_count)) {
              await notificationService.notifyStreakMilestone([myId, partnerId], bond.streak_count);
            }
        }
      }
        
      return { data: revealedDew, error: revealError };
    } else if (updatedDew && (!updatedDew.user_1_response || !updatedDew.user_2_response)) {
         // NOTIFICATION: Waiting (One person just answered)
         const { data: bond } = await supabase
            .from('bonds')
            .select('user_1_id, user_2_id')
            .eq('id', updatedDew.bond_id)
            .single();

         if (bond) {
             const partnerId = isUser1 ? bond.user_2_id : bond.user_1_id;
             const myId = isUser1 ? bond.user_1_id : bond.user_2_id;
             
             if (partnerId && myId) {
                 const { data: myProfile } = await supabase.from('profiles').select('display_name').eq('id', myId).single();
                 const myName = myProfile?.display_name || 'Your partner';
                 await notificationService.notifyDewWaiting(partnerId, myName);
             }
         }
    }

    return { data: updatedDew, error: null };
  },

  // --- NUGS METHODS ---

  async sendNug(bondId: string, senderId: string, type: 'silent' | 'note', content?: string, senderName?: string) {
    const { data, error } = await supabase
      .from('nugs')
      .insert({
        bond_id: bondId,
        sender_id: senderId,
        type,
        content: content || null,
      })
      .select()
      .single();

    if (!error && data) {
         // NOTIFICATION: Nug Received
         // Need recipient ID
         const { data: bond } = await supabase.from('bonds').select('user_1_id, user_2_id').eq('id', bondId).single();
         if (bond) {
             const recipientId = bond.user_1_id === senderId ? bond.user_2_id : bond.user_1_id;
             if (recipientId) {
                 let finalSenderName: string = senderName || '';
                 if (!finalSenderName) {
                      const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', senderId).single();
                      finalSenderName = profile?.display_name || 'Your partner';
                 }
                 
                 await notificationService.notifyNugReceived(recipientId, finalSenderName);
             }
         }
    }

    return { data, error };
  },

  async getRecentNugs(bondId: string, limit = 10) {
    const { data, error } = await supabase
      .from('nugs')
      .select('*')
      .eq('bond_id', bondId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  },

  async breakBond(bondId: string) {
    console.log('[BondService] Breaking bond:', bondId);
    
    // 1. Manual Clean up of related tables (to ensure data integrity if Cascade isn't set)
    const tablesToDelete = [
      'daily_dews',
      'nugs',
      'game_sessions',
      'bond_game_prompts',
      'bond_seen_prompts',
      'relationship_anchors'
    ];

    for (const table of tablesToDelete) {
      const { error } = await supabase.from(table).delete().eq('bond_id', bondId);
      if (error) {
           console.warn(`[BondService] Failed to cleanup ${table}:`, error);
           // We continue even if one fails, hoping the database FKs might handle it or it's already gone
      }
    }

    // 2. Unlink Intimacy Maps (if applicable)
    const { error: mapError } = await supabase
        .from('intimacy_maps')
        .update({ bond_id: null })
        .eq('bond_id', bondId);
    if (mapError) console.warn('[BondService] Failed to unlink intimacy_maps:', mapError);

    // 3. Delete the Bond
    const { error: bondError } = await supabase
      .from('bonds')
      .delete()
      .eq('id', bondId);

    if (bondError) {
      console.error('[BondService] Failed to delete bond:', bondError);
      return { success: false, error: bondError };
    }

    return { success: true, error: null };
  },

  async getPartnerProfile(bond: any, currentUserId: string) {
    if (!bond) {
      console.log('getPartnerProfile: No bond provided');
      return { data: null, error: 'No bond provided' };
    }
    
    const partnerId = bond.user_1_id === currentUserId ? bond.user_2_id : bond.user_1_id;
    console.log('getPartnerProfile: currentUserId=', currentUserId, 'partnerId=', partnerId);
    
    if (!partnerId) {
      console.log('getPartnerProfile: No partner in bond');
      return { data: null, error: 'No partner in bond' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, birth_date, is_onboarding_complete')
      .eq('id', partnerId)
      .single();

    console.log('getPartnerProfile result:', { data, error });
    return { data, error };
  }
};
