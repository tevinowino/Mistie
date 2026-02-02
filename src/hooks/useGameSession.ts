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
  
  // Spin state (for Hard Dare)
  spinResult: 'user_1' | 'user_2' | null;
  spinComplete: boolean;
  isSpinning: boolean;
  isUser1: boolean;

  // Actions
  updateSessionConfig: (config: { heatLevel?: number; mode?: string }) => Promise<void>;
  startGame: (config: { heatLevel: number; mode: string }) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  setReady: (ready: boolean) => void;
  submitAnswer: (answer: string) => void;
  refreshPrompts: () => void;
  endSession: () => void;
  initiateSpin: () => void;
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
  
  // Spin state (for Hard Dare bottle spinner)
  const [spinResult, setSpinResult] = useState<'user_1' | 'user_2' | null>(null);
  const [spinComplete, setSpinComplete] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  
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
    console.log('🎮 [Game] initializeSession called', { bondId, gameTypeSlug, userId: user?.id });
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const startTime = Date.now();
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
      console.log('⏱️ [Game] Bond fetched in', Date.now() - startTime, 'ms');
      setBondData(bond);

      // Get game type
      const { data: gt } = await gameService.getGameTypeBySlug(gameTypeSlug);
      console.log('⏱️ [Game] GameType fetched in', Date.now() - startTime, 'ms');
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
      console.log('⏱️ [Game] Existing session check in', Date.now() - startTime, 'ms, found:', !!existingSession);
      
      if (existingSession) {
        console.log('🔄 [Game] Using existing session, setting up state...');
        await setupSessionState(existingSession, bond, user.id);
        console.log('✅ [Game] Session state setup complete');
        setIsLoading(false);
        return;
      }

      // If no existing session, check if we need config
      console.log('🆕 [Game] No existing session. Checking config requirements...');
      console.log('🔧 [Game] has_spice_meter:', effectiveGt.has_spice_meter, 'has_virtual_mode:', effectiveGt.has_virtual_mode);
      
      if (effectiveGt.has_spice_meter || effectiveGt.has_virtual_mode) {
        console.log('⚙️ [Game] Config needed, showing setup screen');
        setConfigNeeded(true);
        setIsLoading(false);
        return;
      }

      // If no config needed, create default session
      console.log('🚀 [Game] No config needed, starting game with defaults...');
      await startGame({ heatLevel: 1, mode: 'in_person' }, effectiveGt);
      console.log('✅ [Game] startGame completed');
      
    } catch (err) {
      console.error('❌ [Game] Error initializing session:', err);
      setError('Failed to initialize game session');
      setIsLoading(false);
    }
  };

  const startGame = async (config: { heatLevel: number; mode: string }, passedGameType?: GameType) => {
    console.log('🎲 [Game] startGame called with config:', config);
    
    // Use passed gameType or fall back to state
    const gt = passedGameType || gameType;
    
    if (!gt || !bondId || !user) {
      console.log('❌ [Game] startGame aborted - missing:', { gameType: !!gt, bondId: !!bondId, user: !!user });
      return;
    }
    
    setIsLoading(true);
    setConfigNeeded(false);

    try {
      console.log('🔍 [Game] Fetching bond for session creation...');
      const { data: bond } = await supabase
        .from('bonds')
        .select('id, user_1_id, user_2_id')
        .eq('id', bondId)
        .single();

      if (!bond) throw new Error('Bond not found');
      console.log('✅ [Game] Bond found');

      console.log('📝 [Game] Creating new session...');
      const newSession = await createSession(bondId, gt, config);
      console.log('✅ [Game] Session created:', newSession?.id);
      
      if (newSession) {
        console.log('⚙️ [Game] Setting up session state (this will load prompts)...');
        await setupSessionState(newSession, bond, user.id);
        console.log('✅ [Game] Session state setup complete');
      }
    } catch (err) {
      console.error('❌ [Game] Error starting game:', err);
      setError('Failed to start game');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSessionConfig = async (config: { heatLevel?: number; mode?: string }) => {
    if (!session) return;

    // 1. Instant Optimistic UI Update
    const updatedSession = { 
      ...session, 
      heat_level: config.heatLevel ?? session.heat_level, 
      mode: config.mode ?? session.mode 
    };
    setSession(updatedSession);
    
    // 2. Trigger loading immediately (don't wait for DB)
    const heatChanged = config.heatLevel && config.heatLevel !== session.heat_level;
    const modeChanged = config.mode && config.mode !== session.mode;

    if (heatChanged || modeChanged) {
        setIsLoading(true);
        // Fire and forget the prompt load so UI shows loading state immediately
        // We act as if the config is already applied
        loadPrompts(bondId, session.game_type_id, { 
          heatLevel: updatedSession.heat_level, 
          mode: updatedSession.mode,
          // If mode/heat changes, we likely need new prompts. 
          // If we just filtering existing ones, that's fast. 
          // If none exist, loadPrompts will generate.
        }).then(() => setIsLoading(false));
    }

    try {
      // 3. Persist to DB in background
      const { error } = await supabase
        .from('game_sessions')
        .update({
          heat_level: updatedSession.heat_level,
          mode: updatedSession.mode
        })
        .eq('id', session.id);

      if (error) throw error;

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
    // On initial setup, only generate if pool is empty (handled by loadPrompts logic)
    await loadPrompts(bondId, sess.game_type_id, { 
      heatLevel: sess.heat_level, 
      mode: sess.mode,
      // forceRegenerate: false // Default to false to preserve session state
    }); 
  };

  const loadPrompts = async (
    bondId: string, 
    gtId: string, 
    options?: { heatLevel?: number; mode?: string; forceRegenerate?: boolean }
  ) => {
    const promptStart = Date.now();
    console.log('📦 [Game] loadPrompts called', { bondId, gtId, options });
    
    // Try to get existing prompts
    const { data: existingPrompts } = await gameService.getPromptsForGame(
      bondId,
      gtId,
      { limit: 50, heatLevel: options?.heatLevel, mode: options?.mode }
    );

    console.log('📦 [Game] Existing prompts found:', existingPrompts?.length || 0, 'in', Date.now() - promptStart, 'ms');
    
    if (existingPrompts && existingPrompts.length > 0) {
      console.log('✅ [Game] Using existing prompts, no regeneration - TOTAL:', Date.now() - promptStart, 'ms');
      setPrompts(existingPrompts);
      
      // If forceRegenerate is explicitly requested, we MUST regenerate regardless of pool size
      if (options?.forceRegenerate) {
        console.log('🔄 [Game] forceRegenerate requested, cycling prompts...');
        setIsGenerating(true);
        
        // Mark current prompts as used
        await gameService.markPromptsAsUsed(bondId, gtId);
        
        // Generate new ones
        await gameService.generatePrompts(
          bondId, 
          gameTypeSlug, 
          { 
            heatLevel: options?.heatLevel, 
            mode: options?.mode,
            count: 30 
          }
        );
        
        // Reset session index to 0 so both users start at the beginning
        if (session?.id) {
          console.log('🔄 [Game] Resetting session index to 0...');
          await supabase
            .from('game_sessions')
            .update({ current_prompt_index: 0 })
            .eq('id', session.id);
        }
        
        // Fetch the new batch
        const { data: newPrompts } = await gameService.getPromptsForGame(
          bondId, 
          gtId, 
          { limit: 50, heatLevel: options?.heatLevel, mode: options?.mode }
        );
        if (newPrompts) {
          setPrompts(newPrompts);
        }
        setIsGenerating(false);
      }
    } else if (options?.forceRegenerate || existingPrompts?.length === 0) {
      // Only generate if no prompts exist (and we didn't just handle forceRegenerate above)
      // Note: If forceRegenerate was true, we would have entered the first block if prompts existed.
      // So here means prompts=0.
      console.log('🆕 [Game] No prompts found, generating new prompts via AI...');
      console.log('⏳ [Game] AI generation starting at', Date.now() - promptStart, 'ms');
      setIsGenerating(true);
      const { error: genError } = await gameService.generatePrompts(
        bondId, 
        gameTypeSlug, 
        { 
          heatLevel: options?.heatLevel, 
          mode: options?.mode,
          count: 30
        }
      );
      console.log('⏳ [Game] AI generation finished at', Date.now() - promptStart, 'ms');
      
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
        async (payload) => {
          const newData = payload.new as GameSession;
          const oldData = payload.old as GameSession;
          
          console.log('📡 [Game] Real-time update received', { 
            newIndex: newData.current_prompt_index,
            oldIndex: oldData?.current_prompt_index,
            heatChanged: oldData?.heat_level !== undefined && newData.heat_level !== oldData.heat_level,
            modeChanged: oldData?.mode !== undefined && newData.mode !== oldData.mode
          });
          
          // Check for config changes that require prompt reload
          // IMPORTANT: Only trigger if oldData values exist (not first sync)
          const heatChanged = oldData?.heat_level !== undefined && newData.heat_level !== oldData.heat_level;
          const modeChanged = oldData?.mode !== undefined && newData.mode !== oldData.mode;
          
          if (heatChanged || modeChanged) {
            console.log('🔥 [Game] Config changed remotely, reloading prompts...');
            await loadPrompts(bondId, newData.game_type_id, {
              heatLevel: newData.heat_level,
              mode: newData.mode
            });
          }

          // Update current index (this is the key sync!)
          console.log('📍 [Game] Syncing index to:', newData.current_prompt_index || 0);
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

          // Sync spin state from partner
          if (newData.spin_result !== oldData.spin_result) {
            setSpinResult(newData.spin_result || null);
            if (newData.spin_result && !oldData.spin_result) {
              // Partner initiated spin - start our animation too
              setIsSpinning(true);
              setTimeout(() => {
                setSpinComplete(true);
                setIsSpinning(false);
              }, 3000);
            }
          }
          if (newData.spin_complete !== oldData.spin_complete) {
            setSpinComplete(newData.spin_complete || false);
          }
          // Reset spin state when moving to new card
          if (newData.current_prompt_index !== oldData.current_prompt_index) {
            setSpinResult(newData.spin_result || null);
            setSpinComplete(newData.spin_complete || false);
            setIsSpinning(false);
          }
        }
      )
      .on('broadcast', { event: 'refresh-prompts' }, async () => {
         console.log('Received refresh broadcast, reloading prompts...');
         if (session) {
           await loadPrompts(bondId, session.game_type_id, {
             heatLevel: session.heat_level,
             mode: session.mode
           });
         }
      })
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
    console.log('➡️ [Game] goToNext called', { currentIndex, promptsLength: prompts.length });
    if (!session) return;
    
    // Allow index to go one past the end to show "Deck Complete" screen
    const newIndex = currentIndex + 1;
    console.log('➡️ [Game] Moving to index:', newIndex, 'Deck size:', prompts.length);
    
    // Update in database - this will trigger real-time sync
    // Also reset spin state for the new card
    const { error } = await supabase
      .from('game_sessions')
      .update({ 
        current_prompt_index: newIndex,
        user_1_ready: false,
        user_2_ready: false,
        user_1_response: null,
        user_2_response: null,
        spin_result: null,
        spin_initiated_by: null,
        spin_complete: false,
      })
      .eq('id', session.id);

    if (!error) {
      setCurrentIndex(newIndex);
      setIAmReady(false);
      setPartnerReady(false);
      setMyAnswer(null);
      setPartnerAnswer(null);
      // Reset local spin state
      setSpinResult(null);
      setSpinComplete(false);
      setIsSpinning(false);
    }
  }, [session, currentIndex, prompts.length]);

  // Navigate to previous card - synced!
  const goToPrevious = useCallback(async () => {
    console.log('⬅️ [Game] goToPrevious called', { currentIndex });
    if (!session || currentIndex <= 0) return;
    
    const newIndex = currentIndex - 1;
    console.log('⬅️ [Game] Moving to index:', newIndex);
    
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

  // Refresh prompts - explicitly regenerate
  const refreshPrompts = useCallback(async () => {
    if (!bondId || !gameType) return;
    
    // Broadcast to partner that we are refreshing
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'refresh-prompts',
        payload: {}
      });
    }

    const currentHeat = session?.heat_level;
    const currentMode = session?.mode;

    // Force regeneration with the flag
    await loadPrompts(bondId, gameType.id, { 
      heatLevel: currentHeat, 
      mode: currentMode,
      forceRegenerate: true  // Explicitly request regeneration
    });
  }, [bondId, gameType, session]);

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

  // Initiate spin for Hard Dare bottle spinner
  const initiateSpin = useCallback(async () => {
    if (!session || !user || spinResult || isSpinning) return;
    
    // Set local spinning state immediately
    setIsSpinning(true);
    
    // Randomly determine result
    const result: 'user_1' | 'user_2' = Math.random() < 0.5 ? 'user_1' : 'user_2';
    
    // Update database - this triggers sync to partner
    const { error } = await supabase
      .from('game_sessions')
      .update({
        spin_result: result,
        spin_initiated_by: user.id,
        spin_complete: false, // Will be set to true after animation
      })
      .eq('id', session.id);
    
    if (!error) {
      setSpinResult(result);
      
      // Mark spin as complete after animation duration
      setTimeout(async () => {
        setSpinComplete(true);
        setIsSpinning(false);
        
        // Update DB to mark complete
        await supabase
          .from('game_sessions')
          .update({ spin_complete: true })
          .eq('id', session.id);
      }, 3000); // Match animation duration
    } else {
      setIsSpinning(false);
    }
  }, [session, user, spinResult, isSpinning]);

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
    // Spin state
    spinResult,
    spinComplete,
    isSpinning,
    isUser1,
    // Actions
    startGame,
    updateSessionConfig,
    goToNext,
    goToPrevious,
    setReady,
    submitAnswer,
    refreshPrompts,
    endSession,
    initiateSpin,
  };
}
