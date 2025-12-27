import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { GamePrompt, gameService, GameSession, GameType } from '@/src/services/gameService';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseGameSessionOptions {
  bondId: string;
  gameTypeSlug: string;
  gameTypeId?: string;
}

interface UseGameSessionReturn {
  // State
  session: GameSession | null;
  prompts: GamePrompt[];
  currentIndex: number;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  
  // Partner sync
  partnerReady: boolean;
  iAmReady: boolean;
  partnerConnected: boolean;
  myAnswer: string | null;
  partnerAnswer: string | null;
  
  // Configuration
  configNeeded: boolean;
  gameType: GameType | null;

  // Actions
  updateSessionConfig: (config: { heatLevel?: number; mode?: string }) => Promise<void>;
  startGame: (config: { heatLevel: number; mode: string }) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  setReady: (ready: boolean) => void;
  submitAnswer: (answer: string) => void;
  refreshPrompts: () => void;
  endSession: () => void;
}

export function useGameSession({
  bondId,
  gameTypeSlug,
  gameTypeId,
}: UseGameSessionOptions): UseGameSessionReturn {
  const SPICY_SLUGS = ['would-you-rather-hot', 'intimacy', 'hard-dare', 'spicy'];
  const { user } = useAuth();
  
  // State
  const [session, setSession] = useState<GameSession | null>(null);
  const [prompts, setPrompts] = useState<GamePrompt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configNeeded, setConfigNeeded] = useState(false);
  const [gameType, setGameType] = useState<GameType | null>(null);
  
  // Partner sync state
  const [partnerReady, setPartnerReady] = useState(false);
  const [iAmReady, setIAmReady] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [myAnswer, setMyAnswer] = useState<string | null>(null);
  const [partnerAnswer, setPartnerAnswer] = useState<string | null>(null);
  const [bondData, setBondData] = useState<{ user_1_id: string; user_2_id: string } | null>(null);
  
  // Refs
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);

  // Determine if current user is user_1 or user_2 in the bond
  const isUser1 = bondData?.user_1_id === user?.id;

  // Initialize session and subscribe to real-time updates
  useEffect(() => {
    if (!bondId || !user) return;
    
    initializeSession();
    
    return () => {
      // Cleanup subscriptions
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }
    };
  }, [bondId, gameTypeSlug, user]);

  const initializeSession = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Get bond data to know user positions
      const { data: bond } = await supabase
        .from('bonds')
        .select('id, user_1_id, user_2_id')
        .eq('id', bondId)
        .single();
      
      if (!bond) {
        setError('Bond not found');
        setIsLoading(false);
        return;
      }
      setBondData(bond);

      // Get game type
      const { data: gt } = await gameService.getGameTypeBySlug(gameTypeSlug);
      if (!gt) {
        setError('Game not found');
        setIsLoading(false);
        return;
      }

      // Check for forced spicy override
      const isSpicy = gt.has_spice_meter || SPICY_SLUGS.includes(gt.slug || gameTypeSlug);
      const effectiveGt = { ...gt, has_spice_meter: isSpicy };
      
      setGameType(effectiveGt);

      // Check for existing session
      const existingSession = await getExistingSession(bondId, effectiveGt);
      
      if (existingSession) {
        await setupSessionState(existingSession, bond, user.id);
        setIsLoading(false);
        return;
      }

      // If no existing session, check if we need config
      if (effectiveGt.has_spice_meter || effectiveGt.has_virtual_mode) {
        setConfigNeeded(true);
        setIsLoading(false);
        return;
      }

      // If no config needed, create default session
      await startGame({ heatLevel: 1, mode: 'in_person' });
      
    } catch (err) {
      console.error('Error initializing session:', err);
      setError('Failed to initialize game session');
      setIsLoading(false);
    }
  };

  const startGame = async (config: { heatLevel: number; mode: string }) => {
    if (!gameType || !bondId || !user) return;
    
    setIsLoading(true);
    setConfigNeeded(false);

    try {
      const { data: bond } = await supabase
        .from('bonds')
        .select('id, user_1_id, user_2_id')
        .eq('id', bondId)
        .single();

      if (!bond) throw new Error('Bond not found');

      const newSession = await createSession(bondId, gameType, config);
      if (newSession) {
        await setupSessionState(newSession, bond, user.id);
      }
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Failed to start game');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSessionConfig = async (config: { heatLevel?: number; mode?: string }) => {
    if (!session) return;

    // Optimistic update
    const updatedSession = { 
      ...session, 
      heat_level: config.heatLevel ?? session.heat_level, 
      mode: config.mode ?? session.mode 
    };
    setSession(updatedSession);

    try {
      // Update DB
      const { error } = await supabase
        .from('game_sessions')
        .update({
          heat_level: updatedSession.heat_level,
          mode: updatedSession.mode
        })
        .eq('id', session.id);

      if (error) throw error;

      // Reload prompts if heat level changed
      if (config.heatLevel && config.heatLevel !== session.heat_level) {
        setIsLoading(true);
        await loadPrompts(bondId, session.game_type_id, { 
          heatLevel: config.heatLevel, 
          mode: updatedSession.mode 
        });
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error updating session config:', err);
      // Revert on error? For now just log
    }
  };

  const getExistingSession = async (bondId: string, gt: GameType): Promise<GameSession | null> => {
    const { data: existing } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('bond_id', bondId)
      .eq('game_type_id', gt.id)
      .eq('is_active', true)
      .single();

    return existing as GameSession;
  };

  const createSession = async (
    bondId: string, 
    gt: GameType,
    config: { heatLevel: number; mode: string }
  ): Promise<GameSession | null> => {
    const { data: newSession, error } = await supabase
      .from('game_sessions')
      .insert({
        bond_id: bondId,
        game_type_id: gt.id,
        mode: config.mode,
        heat_level: config.heatLevel,
        current_prompt_index: 0,
        user_1_ready: false,
        user_2_ready: false,
        user_1_response: null,
        user_2_response: null,
        is_active: true,
        prompts: [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }
    return newSession as GameSession;
  };

  const setupSessionState = async (
    sess: GameSession, 
    bond: { user_1_id: string; user_2_id: string },
    userId: string
  ) => {
    setSession(sess);
    setCurrentIndex(sess.current_prompt_index || 0);
    
    const isU1 = bond.user_1_id === userId;
    if (isU1) {
      setIAmReady(sess.user_1_ready);
      setPartnerReady(sess.user_2_ready);
      setMyAnswer(sess.user_1_response || null);
      setPartnerAnswer(sess.user_2_response || null);
    } else {
      setIAmReady(sess.user_2_ready);
      setPartnerReady(sess.user_1_ready);
      setMyAnswer(sess.user_2_response || null);
      setPartnerAnswer(sess.user_1_response || null);
    }
    
    subscribeToSession(sess.id, isU1);
    subscribeToPresence(sess.id);

    subscribeToPresence(sess.id);

    // Load prompts using session config
    await loadPrompts(bondId, sess.game_type_id, { 
      heatLevel: sess.heat_level, 
      mode: sess.mode 
    }); 
  };

  const loadPrompts = async (
    bondId: string, 
    gtId: string, 
    options?: { heatLevel?: number; mode?: string }
  ) => {
    // Try to get existing prompts
    const { data: existingPrompts } = await gameService.getPromptsForGame(
      bondId,
      gtId,
      { limit: 50, heatLevel: options?.heatLevel, mode: options?.mode }
    );

    if (existingPrompts && existingPrompts.length >= 10) {
      setPrompts(existingPrompts);
    } else {
      // Generate new prompts
      setIsGenerating(true);
      const { error: genError } = await gameService.generatePrompts(
        bondId, 
        gameTypeSlug, 
        { heatLevel: options?.heatLevel, mode: options?.mode }
      );
      
      if (!genError) {
        const { data: newPrompts } = await gameService.getPromptsForGame(
          bondId, 
          gtId, 
          { limit: 50, heatLevel: options?.heatLevel, mode: options?.mode }
        );
        if (newPrompts) {
          setPrompts(newPrompts);
        }
      }
      setIsGenerating(false);
    }
  };

  const subscribeToSession = (sessionId: string, isUser1: boolean) => {
    // Subscribe to session changes
    channelRef.current = supabase
      .channel(`game_session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const newData = payload.new as GameSession;
          
          // Update current index (this is the key sync!)
          setCurrentIndex(newData.current_prompt_index || 0);
          setSession(newData);
          
          // Update ready states and answers based on position
          if (isUser1) {
            setIAmReady(newData.user_1_ready);
            setPartnerReady(newData.user_2_ready);
            setMyAnswer(newData.user_1_response || null);
            setPartnerAnswer(newData.user_2_response || null);
          } else {
            setIAmReady(newData.user_2_ready);
            setPartnerReady(newData.user_1_ready);
            setMyAnswer(newData.user_2_response || null);
            setPartnerAnswer(newData.user_1_response || null);
          }
        }
      )
      .subscribe();
  };

  const subscribeToPresence = (sessionId: string) => {
    // Subscribe to partner presence
    presenceChannelRef.current = supabase
      .channel(`presence:game:${sessionId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannelRef.current?.presenceState() || {};
        const userIds = Object.keys(state);
        // Partner is connected if there's more than 1 user
        setPartnerConnected(userIds.length > 1);
      })
      .on('presence', { event: 'join' }, () => {
        setPartnerConnected(true);
      })
      .on('presence', { event: 'leave' }, () => {
        const state = presenceChannelRef.current?.presenceState() || {};
        setPartnerConnected(Object.keys(state).length > 1);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await presenceChannelRef.current?.track({ user_id: user.id });
        }
      });
  };

  // Navigate to next card - synced!
  const goToNext = useCallback(async () => {
    if (!session) return;
    
    const newIndex = currentIndex < prompts.length - 1 ? currentIndex + 1 : 0;
    
    // Update in database - this will trigger real-time sync
    const { error } = await supabase
      .from('game_sessions')
      .update({ 
        current_prompt_index: newIndex,
        user_1_ready: false,
        user_2_ready: false,
        user_1_response: null,
        user_2_response: null,
      })
      .eq('id', session.id);

    if (!error) {
      setCurrentIndex(newIndex);
      setIAmReady(false);
      setPartnerReady(false);
      setMyAnswer(null);
      setPartnerAnswer(null);
    }
  }, [session, currentIndex, prompts.length]);

  // Navigate to previous card - synced!
  const goToPrevious = useCallback(async () => {
    if (!session || currentIndex <= 0) return;
    
    const newIndex = currentIndex - 1;
    
    const { error } = await supabase
      .from('game_sessions')
      .update({ 
        current_prompt_index: newIndex,
        user_1_ready: false,
        user_2_ready: false,
        user_1_response: null,
        user_2_response: null,
      })
      .eq('id', session.id);

    if (!error) {
      setCurrentIndex(newIndex);
      setIAmReady(false);
      setPartnerReady(false);
      setMyAnswer(null);
      setPartnerAnswer(null);
    }
  }, [session, currentIndex]);

  // Set ready state
  const setReady = useCallback(async (ready: boolean) => {
    if (!session) return;
    
    const updateField = isUser1 ? 'user_1_ready' : 'user_2_ready';
    
    const { error } = await supabase
      .from('game_sessions')
      .update({ [updateField]: ready })
      .eq('id', session.id);

    if (!error) {
      setIAmReady(ready);
    }
  }, [session, isUser1]);

  // Submit answer
  const submitAnswer = useCallback(async (answer: string) => {
    if (!session) return;
    
    const updateField = isUser1 ? 'user_1_response' : 'user_2_response';
    
    const { error } = await supabase
      .from('game_sessions')
      .update({ [updateField]: answer })
      .eq('id', session.id);

    if (!error) {
      setMyAnswer(answer);
    }
  }, [session, isUser1]);

  // Refresh prompts
  const refreshPrompts = useCallback(async () => {
    if (!bondId || !gameTypeId) return;
    
    setIsGenerating(true);
    const currentHeat = session?.heat_level;
    const currentMode = session?.mode;

    await gameService.generatePrompts(bondId, gameTypeSlug, { heatLevel: currentHeat, mode: currentMode });
    await loadPrompts(bondId, gameTypeId, { heatLevel: currentHeat, mode: currentMode });
    setIsGenerating(false);
  }, [bondId, gameTypeId, gameTypeSlug, session]);

  // End session
  const endSession = useCallback(async () => {
    if (!session) return;
    
    await supabase
      .from('game_sessions')
      .update({ 
        is_active: false, 
        ended_at: new Date().toISOString() 
      })
      .eq('id', session.id);

    setSession(null);
  }, [session]);

  return {
    session,
    prompts,
    currentIndex,
    isLoading,
    isGenerating,
    error,
    partnerReady,
    iAmReady,
    partnerConnected,
    myAnswer,
    partnerAnswer,
    configNeeded,
    gameType,
    startGame,
    updateSessionConfig,
    goToNext,
    goToPrevious,
    setReady,
    submitAnswer,
    refreshPrompts,
    endSession,
  };
}
