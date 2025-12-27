import { FloatingHeader } from '@/src/components/ui/FloatingHeader';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { supabase } from '@/src/lib/supabase';
import { bondService } from '@/src/services/bondService';
import { darkColors, lightColors, lightColors as staticColors } from '@/src/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Check, ChevronRight, Clock, Droplets, Send } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function DailyDew() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;
  const [dew, setDew] = useState<any>(null);
  const [bond, setBond] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [expandedDewId, setExpandedDewId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastDews, setPastDews] = useState<any[]>([]);
  const [partnerName, setPartnerName] = useState('Partner');
  // Derived state
  const isUser1 = bond?.user_1_id === user?.id;
  const myResponse = isUser1 ? dew?.user_1_response : dew?.user_2_response;
  const partnerResponse = isUser1 ? dew?.user_2_response : dew?.user_1_response;
  const isRevealed = dew?.is_revealed;
  const hasAnswered = !!myResponse;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  // Real-time subscription
  useEffect(() => {
    if (!bond?.id) return;

    const channel = supabase
      .channel(`dew-${bond.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'daily_dews',
          filter: `bond_id=eq.${bond.id}`,
        },
        (payload) => {
          console.log('Realtime update:', payload.new);
          setDew(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bond?.id]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    
    // 1. Get Bond
    const { data: bondData } = await bondService.getUserBond(user.id);
    setBond(bondData);

    if (bondData) {
      // 2. Get Today's Dew
      let { data: dewData } = await bondService.getTodayDew(bondData.id);
      
      // FALLBACK: If no dew exists for today, call edge function to generate one
      if (!dewData) {
        console.log('[DailyDew] No dew for today, triggering edge function...');
        try {
          const response = await fetch('https://eadkkxsqjoutwtmovtpc.supabase.co/functions/v1/generate-daily-dew', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bond_id: bondData.id })
          });
          
          const fnData = await response.json();
          
          if (fnData?.success && fnData?.results?.[0]?.success) {
            console.log('[DailyDew] Dew generated successfully, refetching...');
            // Re-fetch the newly created dew
            const { data: newDewData } = await bondService.getTodayDew(bondData.id);
            dewData = newDewData;
          } else {
            console.error('[DailyDew] Edge function error:', fnData);
          }
        } catch (err) {
          console.error('[DailyDew] Failed to invoke edge function:', err);
        }
      }
      
      setDew(dewData);

      // 3. Get Partner's Name
      const { data: partnerProfile } = await bondService.getPartnerProfile(bondData, user.id);
      if (partnerProfile?.display_name) {
        setPartnerName(partnerProfile.display_name);
      }

      // 3. Get Past Dews (excluding today)
      const today = new Date().toISOString().split('T')[0];
      const { data: pastData } = await supabase
        .from('daily_dews')
        .select('*')
        .eq('bond_id', bondData.id)
        .eq('is_revealed', true)
        .neq('scheduled_for', today)
        .order('scheduled_for', { ascending: false })
        .limit(5);
      setPastDews(pastData || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!answer.trim() || !dew || !bond) return;
    setIsSubmitting(true);
    
    const { data: updatedDew, error } = await bondService.answerDailyDew(dew.id, answer, isUser1);
    
    setIsSubmitting(false);
    if (!error && updatedDew) {
      setDew(updatedDew);
      setAnswer(''); // Clear input
    }
  };

  if (isLoading) {
    return (
      <ScreenWrapper variant="dawn">
         <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Clock color={staticColors.primary} size={40} />
            <Text style={{marginTop: 20, fontFamily: 'Outfit', color: staticColors.muted}}>Loading Daily Dew...</Text>
         </View>
      </ScreenWrapper>
    );
  }

  if (!bond) {
    return (
       <ScreenWrapper variant="dawn">
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
             <Droplets color={staticColors.muted} size={40} />
             <Text style={{textAlign: 'center', marginTop: 20, fontFamily: 'Outfit', fontSize: 18, color: staticColors.text}}>
                You need a partner to share dews with.
             </Text>
          </View>
       </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper variant="dawn">
      <FloatingHeader 
        avatarSource={require('@/src/assets/images/avatar.png')}
        onProfilePress={() => router.push('/profile')}
        onNotificationPress={() => console.log('Notifications')}
        streak={bond?.streak_count || 0}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* HERO HEADER */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Daily Dew</Text>
          <Text style={[styles.pageSubtitle, { color: colors.muted }]}>Today's question for connection</Text>
        </View>

        {/* MAIN QUESTION CARD */}
        <View style={[
          styles.glassCard, 
          styles.questionCard, 
          { 
             backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)', 
             borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'white' 
          }
        ]}>
          <LinearGradient
            colors={isDark ? ['rgba(255,255,255,0.05)', 'transparent'] : ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={[styles.badgeContainer, { backgroundColor: isDark ? 'rgba(255, 75, 125, 0.15)' : '#FFE4EC' }]}>
            <Clock color={colors.primary} size={12} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>TODAY'S DROP</Text>
          </View>
          
          <Text style={[styles.questionText, { color: colors.text }]}>
            {dew ? `"${dew.question_text}"` : "Waiting for today's drop..."}
          </Text>

          {/* STATE 1: REVEALED */}
          {isRevealed ? (
            <View style={styles.revealedSection}>
               <View style={styles.responseContainer}>
                  <View style={[styles.responseHeader, { marginBottom: 8 }]}>
                    <Text style={[styles.avatarLabel, { color: colors.primary }]}>YOU</Text>
                  </View>
                  <Text style={[styles.responseText, { color: colors.text }]}>{myResponse}</Text>
               </View>
               
               <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />

               <View style={styles.responseContainer}>
                  <View style={[styles.responseHeader, { marginBottom: 8 }]}>
                    <Text style={[styles.avatarLabel, { color: colors.secondary }]}>{partnerName.toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.responseText, { color: colors.text }]}>{partnerResponse}</Text>
               </View>
               
               <View style={styles.footerNote}>
                  <Check color={colors.success || '#4CAF50'} size={14} />
                  <Text style={[styles.footerText, { color: colors.muted }]}>Connected for today</Text>
               </View>
            </View>
          ) : hasAnswered ? (
             /* STATE 2: WAITING */
            <View style={styles.waitingState}>
              <View style={[styles.waitingRing, { borderColor: colors.primary }]}>
                <Clock color={colors.primary} size={24} />
              </View>
              <Text style={[styles.waitingText, { color: colors.text }]}>Waiting for {partnerName}...</Text>
              <Text style={[styles.waitingHint, { color: colors.muted }]}>Answers reveal when you both reply</Text>
            </View>
          ) : dew ? (
             /* STATE 3: ANSWERING */
            <View style={styles.inputSection}>
              <TextInput
                style={[
                  styles.modernInput, 
                  { 
                    color: colors.text, 
                    backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent'
                  }
                ]}
                placeholder="Type your answer..."
                placeholderTextColor={colors.muted}
                value={answer}
                onChangeText={setAnswer}
                multiline
              />
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Send color="white" size={18} />
                  <Text style={styles.buttonText}>
                    {isSubmitting ? 'Sending...' : 'Reveal'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* PAST DROPS */}
        <View style={styles.pastSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>History</Text>
          
          {pastDews.length === 0 ? (
            <Text style={[styles.waitingHint, { color: colors.muted, marginTop: 20 }]}>No past drops yet.</Text>
          ) : (
            pastDews.map((item, i) => {
              const isExpanded = expandedDewId === item.id;
              return (
                <TouchableOpacity 
                  key={i} 
                  activeOpacity={0.8}
                  onPress={() => setExpandedDewId(isExpanded ? null : item.id)}
                  style={[
                    styles.glassCard, 
                    styles.pastItem, 
                    { 
                      backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'white',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: 12
                    }
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={styles.pastContent}>
                       <View style={styles.pastHeader}>
                          <Clock color={colors.muted} size={12} />
                          <Text style={[styles.pastDate, { color: colors.muted }]}>{item.scheduled_for}</Text>
                       </View>
                       <Text style={[styles.pastText, { color: colors.text }]} numberOfLines={isExpanded ? undefined : 2}>
                         {item.question_text}
                       </Text>
                    </View>
                    <ChevronRight 
                      color={colors.muted} 
                      size={16} 
                      style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                    />
                  </View>

                  {/* Expanded Answers */}
                  {isExpanded && (
                    <View style={{ marginTop: 8, gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                      {/* My Answer */}
                      <View>
                        <Text style={[styles.avatarLabel, { color: colors.primary }]}>YOU</Text>
                        <Text style={[styles.responseText, { color: colors.text, fontSize: 14 }]}>
                          {item.user_1_response || "No answer"}
                        </Text>
                      </View>
                      
                      {/* Partner Answer */}
                      <View>
                        <Text style={[styles.avatarLabel, { color: colors.secondary }]}>PARTNER</Text>
                        <Text style={[styles.responseText, { color: colors.text, fontSize: 14 }]}>
                          {item.user_2_response || "No answer"}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pageTitle: {
    fontFamily: 'Outfit',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: 'Quicksand',
    fontSize: 16,
  },
  glassCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  questionCard: {
    padding: 24,
    marginBottom: 32,
    minHeight: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 24,
  },
  badgeText: {
    fontFamily: 'Outfit',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  questionText: {
    fontFamily: 'DancingScript',
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 32,
    color: staticColors.text,
  },
  
  // INPUT SECTION
  inputSection: {
    width: '100%',
    gap: 16,
  },
  modernInput: {
    width: '100%',
    minHeight: 120,
    padding: 16,
    borderRadius: 16,
    fontFamily: 'Quicksand',
    fontSize: 16,
    lineHeight: 24,
    borderWidth: 1,
  },
  sendButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.5,
  },

  // WAITING STATE
  waitingState: {
    alignItems: 'center',
  },
  waitingRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderStyle: 'dashed',
  },
  waitingText: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  waitingHint: {
    fontFamily: 'Quicksand',
    fontSize: 14,
  },

  // REVEALED STATE
  revealedSection: {
    width: '100%',
  },
  responseContainer: {
    marginBottom: 12,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarLabel: {
    fontFamily: 'Outfit',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  responseText: {
    fontFamily: 'Quicksand',
    fontSize: 16,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
    opacity: 0.8,
  },
  footerText: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    fontWeight: '600',
  },

  // PAST SECTION
  pastSection: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingLeft: 4,
  },
  pastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  pastContent: {
    flex: 1,
    gap: 4,
  },
  pastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pastDate: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    fontWeight: '600',
  },
  pastText: {
    fontFamily: 'Outfit',
    fontSize: 15,
    fontWeight: '500',
  },
});

