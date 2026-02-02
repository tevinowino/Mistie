import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
  push_token?: string;
  birth_date?: string; // YYYY-MM-DD
  gender?: string;
  notifications_enabled?: boolean;
  is_onboarding_complete: boolean;
  created_at: string;
}

export const profileService = {
  // Fetch full profile details
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data: data as Profile, error };
  },

  // Update profile fields
  async updateProfile(userId: string, updates: Partial<Profile>) {
    console.log('=== profileService.updateProfile ===');
    console.log('UserId:', userId);
    console.log('Updates:', JSON.stringify(updates, null, 2));
    
    // First, verify the profile exists
    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('id', userId)
      .maybeSingle();
    
    console.log('Existing profile check:', { existing, fetchError });
    
    if (!existing) {
      console.error('Profile not found for userId:', userId);
      return { data: null, error: { message: 'Profile not found' } };
    }
    
    // Now update
    console.log('Attempting update...');
    const { data, error, count, status, statusText } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();

    console.log('Update result:', { 
      data, 
      error, 
      count,
      status,
      statusText,
      dataLength: data?.length 
    });

    if (error) {
      console.error('Supabase update error:', error);
      return { data: null, error };
    }
    
    if (!data || data.length === 0) {
      console.error('Update returned no data - RLS may be blocking the update');
      return { data: null, error: { message: 'Update failed - no rows affected' } };
    }
    
    // Return first result
    console.log('Update successful:', data[0]);
    return { data: data[0] as Profile, error: null };
  },

  // Mark onboarding as complete
  async completeOnboarding(userId: string) {
    return this.updateProfile(userId, { is_onboarding_complete: true });
  },

  // Set birthdate (and optionally other fields)
  async setBirthDate(userId: string, birthDate: string) {
    return this.updateProfile(userId, { birth_date: birthDate });
  }
};
