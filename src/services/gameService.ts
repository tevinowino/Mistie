import { supabase } from '@/src/lib/supabase';

// Types
export interface GameCategory {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  gradient_colors: string[];
  sort_order: number;
  is_adult: boolean;
}

export interface GameType {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  gradient_colors: string[];
  gameplay_type: string;
  is_adult: boolean;
  has_virtual_mode: boolean;
  has_spice_meter: boolean;
  sort_order: number;
}

export interface GamePrompt {
  id: string;
  prompt_text: string;
  option_a?: string;
  option_b?: string;
  mode: string;
  heat_level: number;
  is_used: boolean;
}

export interface GameSession {
  id: string;
  bond_id: string;
  game_type_id: string;
  mode: string;
  heat_level: number;
  current_prompt_index: number;
  prompts: string[];
  user_1_ready: boolean;
  user_2_ready: boolean;
  user_1_response?: string | null;
  user_2_response?: string | null;
  is_active: boolean;
  // Bottle spinner fields
  spin_result?: 'user_1' | 'user_2' | null;
  spin_initiated_by?: string | null;
  spin_complete?: boolean;
}

class GameService {
  // ==========================================
  // CATEGORIES & TYPES
  // ==========================================

  async getCategories() {
    const { data, error } = await supabase
      .from('game_categories')
      .select('*')
      .order('sort_order');
    
    return { data: data as GameCategory[] | null, error };
  }

  async getGameTypes(categoryId?: string) {
    let query = supabase
      .from('game_types')
      .select('*')
      .order('sort_order');
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    return { data: data as GameType[] | null, error };
  }

  async getGameTypeBySlug(slug: string) {
    const { data, error } = await supabase
      .from('game_types')
      .select('*')
      .eq('slug', slug)
      .single();
    
    return { data: data as GameType | null, error };
  }

  // ==========================================
  // PROMPTS
  // ==========================================

  async getPromptsForGame(
    bondId: string, 
    gameTypeId: string, 
    options?: { 
      heatLevel?: number; 
      mode?: string;
      limit?: number;
    }
  ) {
    let query = supabase
      .from('bond_game_prompts')
      .select('*')
      .eq('bond_id', bondId)
      .eq('game_type_id', gameTypeId)
      .eq('is_used', false);

    if (options?.heatLevel) {
      query = query.eq('heat_level', options.heatLevel);
    }
    if (options?.mode && options.mode !== 'both') {
      query = query.or(`mode.eq.${options.mode},mode.eq.both`);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data: data as GamePrompt[] | null, error };
  }

  async getSeedPrompts(
    gameTypeId: string,
    options?: {
      heatLevel?: number;
      limit?: number;
    }
  ) {
    let query = supabase
      .from('game_prompts')
      .select('*')
      .eq('game_type_id', gameTypeId)
      .eq('is_seed', true);

    if (options?.heatLevel) {
      query = query.eq('heat_level', options.heatLevel);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    return { data: data as GamePrompt[] | null, error };
  }

  async markPromptAsUsed(promptId: string) {
    const { error } = await supabase
      .from('bond_game_prompts')
      .update({ is_used: true })
      .eq('id', promptId);
    
    return { error };
  }

  // ==========================================
  // GENERATE PROMPTS (Edge Function)
  // ==========================================

  async generatePrompts(
    bondId: string,
    gameTypeSlug: string,
    options?: {
      heatLevel?: number;
      mode?: string;
    }
  ) {
    try {
      // Get user session for authenticated requests
      const { data: { session } } = await supabase.auth.getSession();
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
      
      const requestBody = {
        bond_id: bondId,
        game_type_slug: gameTypeSlug,
        heat_level: options?.heatLevel || 2,
        mode: options?.mode || 'in_person',
      };
      
      console.log('📤 [generatePrompts] Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(
        'https://eadkkxsqjoutwtmovtpc.supabase.co/functions/v1/generate-game-prompts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${session?.access_token || anonKey}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [generatePrompts] Edge Function error:', response.status, errorText);
        return { data: null, error: new Error(`API error: ${response.status}`) };
      }

      const data = await response.json();
      console.log('📥 [generatePrompts] Response:', JSON.stringify(data, null, 2));
      return { data, error: null };
    } catch (error) {
      console.error('generatePrompts error:', error);
      return { data: null, error };
    }
  }

  // ==========================================
  // SESSIONS
  // ==========================================

  async createSession(
    bondId: string,
    gameTypeId: string,
    promptIds: string[],
    options?: {
      mode?: string;
      heatLevel?: number;
    }
  ) {
    // End any existing active session for this game
    await supabase
      .from('game_sessions')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('bond_id', bondId)
      .eq('game_type_id', gameTypeId)
      .eq('is_active', true);

    // Create new session
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        bond_id: bondId,
        game_type_id: gameTypeId,
        prompts: promptIds,
        mode: options?.mode || 'in_person',
        heat_level: options?.heatLevel || 2,
        current_prompt_index: 0,
        user_1_ready: false,
        user_2_ready: false,
        is_active: true,
      })
      .select()
      .single();

    return { data: data as GameSession | null, error };
  }

  async getActiveSession(bondId: string, gameTypeId: string) {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('bond_id', bondId)
      .eq('game_type_id', gameTypeId)
      .eq('is_active', true)
      .single();

    return { data: data as GameSession | null, error };
  }

  async updateSessionIndex(sessionId: string, newIndex: number) {
    const { error } = await supabase
      .from('game_sessions')
      .update({ 
        current_prompt_index: newIndex,
        user_1_ready: false,
        user_2_ready: false,
      })
      .eq('id', sessionId);

    return { error };
  }

  async endSession(sessionId: string) {
    const { error } = await supabase
      .from('game_sessions')
      .update({ 
        is_active: false, 
        ended_at: new Date().toISOString() 
      })
      .eq('id', sessionId);

    return { error };
  }

  // ==========================================
  // RESPONSES
  // ==========================================

  async saveResponse(
    sessionId: string,
    promptId: string,
    userId: string,
    response: string,
    promptSource: 'seed' | 'bond' = 'bond'
  ) {
    const { data, error } = await supabase
      .from('game_responses')
      .insert({
        session_id: sessionId,
        prompt_id: promptId,
        user_id: userId,
        response,
        prompt_source: promptSource,
      })
      .select()
      .single();

    return { data, error };
  }
}

export const gameService = new GameService();
