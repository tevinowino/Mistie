import { supabase } from '../lib/supabase';

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
        user_1_profile:profiles!bonds_user_1_id_fkey(id, display_name, avatar_url),
        user_2_profile:profiles!bonds_user_2_id_fkey(id, display_name, avatar_url)
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

    return { data, error };
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

      // INCREMENT STREAK MANUALLY
      // (The trigger might fail if is_revealed is set to true in the update, so we do it here)
      const { data: bond } = await supabase
        .from('bonds')
        .select('streak_count, best_streak')
        .eq('id', updatedDew.bond_id)
        .single();
      
      if (bond) {
        const newStreak = (bond.streak_count || 0) + 1;
        const newBest = Math.max(bond.best_streak || 0, newStreak);
        
        await supabase
          .from('bonds')
          .update({ 
            streak_count: newStreak,
            best_streak: newBest
          })
          .eq('id', updatedDew.bond_id);
      }
        
      return { data: revealedDew, error: revealError };
    }

    return { data: updatedDew, error: null };
  },

  // --- NUGS METHODS ---

  async sendNug(bondId: string, senderId: string, type: 'silent' | 'note', content?: string) {
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
      .select('id, display_name, avatar_url')
      .eq('id', partnerId)
      .single();

    console.log('getPartnerProfile result:', { data, error });
    return { data, error };
  }
};
