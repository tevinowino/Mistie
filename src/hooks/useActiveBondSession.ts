import { supabase } from '@/src/lib/supabase';
import { gameService, GameSession, GameType } from '@/src/services/gameService';
import { useEffect, useState } from 'react';

export function useActiveBondSession(bondId: string | undefined) {
  const [activeSession, setActiveSession] = useState<(GameSession & { game_types: GameType }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bondId) {
        setLoading(false);
        return;
    }

    const fetchSession = async () => {
      setLoading(true);
      const { data } = await gameService.getActiveSessionForBond(bondId);
      if (data) {
          setActiveSession(data);
      } else {
          setActiveSession(null);
      }
      setLoading(false);
    };

    fetchSession();

    // Subscribe to changes
    const channel = supabase
      .channel(`active-game-${bondId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT (new game) and UPDATE (game end/change)
          schema: 'public',
          table: 'game_sessions',
          filter: `bond_id=eq.${bondId}`,
        },
        async (payload) => {
             console.log('📡 [ActiveSession] Received update:', payload.eventType);
             
             // Simple strategy: refetch on any relevant change to get the joined data
             // (Since we need game_types join, we can't just use payload.new directly easily)
             if (payload.eventType === 'INSERT') {
                 fetchSession();
             } else if (payload.eventType === 'UPDATE') {
                 // Check if is_active changed
                 const newData = payload.new as GameSession;
                 // If it became inactive, we can clear localized
                 if (newData.is_active === false) {
                     // Only if it matches our current session or generally clear
                     // If multiple sessions (race condition), refetch is safest
                     fetchSession();
                 } else {
                     // If it updated but is still active (e.g. index changed), we don't necessarily update banner unless we want to track progress?
                     // Banner just shows "Join".
                     // But if a NEW game started replacing old one?
                     fetchSession();
                 }
             }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bondId]);

  return { activeSession, loading };
}
