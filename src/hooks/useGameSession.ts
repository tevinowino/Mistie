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
        // Force reload logic (Host should generate/fetch, Guest should wait)
        // For optimisic UI, we can clear prompts or show loading
        setPrompts([]); 
        
        // If I am the one updating, I should probably drive the update
        loadPrompts(bondId, session.game_type_id, { 
          heatLevel: updatedSession.heat_level, 
          mode: updatedSession.mode,
          forceRegenerate: true // Treat config change as a need to refresh
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
        prompts: [], // Initialize empty, loadPrompts will fill it
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

    // Initial Load - Check session prompts first
    if (sess.prompts && sess.prompts.length > 0) {
        // @ts-ignore - Supabase types are weird vs our manually defined ones
        setPrompts(sess.prompts as GamePrompt[]);
        setIsLoading(false);
    } else {
        // If empty, trigger load/generation
        await loadPrompts(bondId, sess.game_type_id, { 
            heatLevel: sess.heat_level, 
            mode: sess.mode,
        }); 
    }
  };

  const loadPrompts = async (
    bondId: string, 
    gtId: string, 
    options?: { heatLevel?: number; mode?: string; forceRegenerate?: boolean }
  ) => {
    const promptStart = Date.now();
    console.log('📦 [Game] loadPrompts called', { bondId, gtId, options, isUser1 });

    // Race Condition Fix:
    // 1. If we are NOT User 1, and we are not forcing a refresh manually, 
    //    we should wait for the session to be updated by User 1.
    //    BUT, if prompts are empty and we are alone or partner is offline, we might need to take charge.
    //    For now, we enforce User 1 as the generator if connected.
    
    const shouldGenerate = isUser1 || options?.forceRegenerate;
    
    if (!shouldGenerate) {
       // If I am User 2, and I see no prompts, I will wait for the realtime update.
       // However, checking bond_game_prompts as a backup is okay, 
       // but we should PREFER session.prompts to ensure sync.
       
       // If there are existing prompts in `session` (passed in props or state), use them.
       // (This is handled in setupSessionState).
       
       // If we are here, it means we need to fetch.
       // Ideally User 2 just waits. But lets fetch from DB just in case User 1 is offline but data exists.
    }

    // Step 1: Fetch from 'bond_game_prompts' (The Cache)
    const { data: existingPrompts } = await gameService.getPromptsForGame(
      bondId,
      gtId,
      { limit: 50, heatLevel: options?.heatLevel, mode: options?.mode }
    );

    console.log('📦 [Game] Existing prompts found:', existingPrompts?.length || 0, 'in', Date.now() - promptStart, 'ms');
    
    if (existingPrompts && existingPrompts.length > 0 && !options?.forceRegenerate) {
        // Found existing prompts in cache. Use them.
        console.log('✅ [Game] Using existing cache prompts.');
        setPrompts(existingPrompts);
        
        // SYNC: Update the session so partner sees the same list
        if (session) {
             await supabase
            .from('game_sessions')
            .update({ prompts: existingPrompts })
            .eq('id', session.id);
        }
        
    } else {
        // Empty cache OR Force Regenerate
        
        // Critical: Only User 1 should generate if both are present. 
        // Or whoever initiated the forceRegenerate.
        // If this is an automatic load (options.forceRegenerate is undefined), only User 1 generates.
        if (isUser1 || options?.forceRegenerate) {
             console.log('🔄 [Game] Generating new prompts...');
             setIsGenerating(true);
             
             // If forcing, mark old as used
             if (options?.forceRegenerate) {
                 await gameService.markPromptsAsUsed(bondId, gtId);
             }

             // Generate
             const { error: genError } = await gameService.generatePrompts(
                bondId, 
                gameTypeSlug, 
                { 
                  heatLevel: options?.heatLevel, 
                  mode: options?.mode,
                  count: 30
                }
             );
             
             if (!genError) {
                 // Fetch the newly generated ones
                 const { data: newPrompts } = await gameService.getPromptsForGame(
                   bondId, 
                   gtId, 
                   { limit: 50, heatLevel: options?.heatLevel, mode: options?.mode }
                 );
                 
                 if (newPrompts) {
                   setPrompts(newPrompts);
                   // SYNC: Update session
                   if (session) {
                       await supabase
                        .from('game_sessions')
                        .update({ 
                            prompts: newPrompts,
                            current_prompt_index: 0 // Reset index on generation
                        })
                        .eq('id', session.id);
                   }
                 }
             }
             setIsGenerating(false);
        } else {
            console.log('⏳ [Game] Waiting for partner to generate prompts...');
            // User 2 just waits. The Realtime subscription will deliver the prompts.
        }
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
            promptCount: (newData.prompts as any)?.length,
            heatChanged: oldData?.heat_level !== undefined && newData.heat_level !== oldData.heat_level,
          });
          
          setSession(newData);
          
          // 1. Sync Prompts
          // If prompts array changed, update local state
          const newPrompts = newData.prompts as unknown as GamePrompt[];
          // Simple equality check by length or ID
          const oldPromptsLength = (oldData.prompts as unknown as GamePrompt[])?.length || 0;
          
          if (newPrompts && newPrompts.length > 0 && newPrompts.length !== oldPromptsLength) {
              console.log('📡 [Game] Received new prompt list from session.');
              setPrompts(newPrompts);
              setIsLoading(false); 
              setIsGenerating(false);
          } else if (newPrompts && newPrompts.length > 0 && prompts.length === 0) {
              // Initial sync arriving late
              console.log('📡 [Game] Received initial prompt list.');
              setPrompts(newPrompts);
              setIsLoading(false);
          }

          // 2. Sync Index
          setCurrentIndex(newData.current_prompt_index || 0);
          
          // 3. Sync Responses/Ready
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

          // 4. Sync Spin (Hard Dare)
          if (newData.spin_result !== oldData.spin_result) {
            setSpinResult(newData.spin_result || null);
            if (newData.spin_result && !oldData.spin_result) {
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
         // With the new Logic, strictly rely on Session Update.
         // But we can show a toaster or loading state.
         console.log('Received refresh broadcast');
         setIsGenerating(true); 
         // Do NOT call loadPrompts here. Wait for the Postgres UPDATE with the new prompts.
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
    if (!bondId || !gameType || !session) return;
    
    // Broadcast to partner that we are refreshing
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'refresh-prompts',
        payload: {}
      });
    }

    // Call loadPrompts with forceRegenerate: true
    // This will trigger generation, fetch new prompts, and UPDATE the session.prompts
    // The partner (and myself) will receive the update via Postgres subscription
    await loadPrompts(bondId, gameType.id, { 
      heatLevel: session.heat_level, 
      mode: session.mode,
      forceRegenerate: true
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
    
    setIsSpinning(true);
    
    const result: 'user_1' | 'user_2' = Math.random() < 0.5 ? 'user_1' : 'user_2';
    
    const { error } = await supabase
      .from('game_sessions')
      .update({
        spin_result: result,
        spin_initiated_by: user.id,
        spin_complete: false,
      })
      .eq('id', session.id);
    
    if (!error) {
      setSpinResult(result);
      setTimeout(async () => {
        setSpinComplete(true);
        setIsSpinning(false);
        await supabase
          .from('game_sessions')
          .update({ spin_complete: true })
          .eq('id', session.id);
      }, 3000);
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
