import { GameCard } from '@/src/components/dashboard/GameCard';
import { OnboardingProgressCard } from '@/src/components/dashboard/OnboardingProgressCard';
import { RelationshipDurationCard } from '@/src/components/dashboard/RelationshipDurationCard';
import { HarmonyRing } from '@/src/components/HarmonyRing';
import { NugButton } from '@/src/components/NugButton';
import { NugReceivedModal } from '@/src/components/NugReceivedModal';
import { NugSentOverlay } from '@/src/components/NugSentOverlay';
import { BondOnboardingModal } from '@/src/components/onboarding/BondOnboardingModal';
import { IndividualOnboardingModal } from '@/src/components/onboarding/IndividualOnboardingModal';
import { FloatingHeader } from '@/src/components/ui/FloatingHeader';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useOnboardingStatus } from '@/src/hooks/useOnboardingStatus';
import { supabase } from '@/src/lib/supabase';
import { bondService } from '@/src/services/bondService';
import { darkColors, lightColors } from '@/src/theme/colors';
import { getGameBackgroundImage, getGamesByCategory } from '@/src/utils/gameImages';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Droplets,
  Flame,
  Heart,
  Link,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Get greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// Icon mapping for games
const GAME_ICONS: Record<string, React.ReactNode> = {
  'crush': <Heart color="white" size={24} />,
  'deep-night': <Sparkles color="white" size={24} />,
  'would-you-rather-hot': <Flame color="white" size={24} />,
  'intimacy': <Heart color="white" size={24} />,
  'hard-dare': <Zap color="white" size={24} />,
};

export default function Dashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;
  
  const [streak, setStreak] = useState(0);
  const [nugsCount, setNugsCount] = useState(0);
  const [isLinked, setIsLinked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bond, setBond] = useState<any>(null);
  const [partnerName, setPartnerName] = useState('Partner');
  const [userName, setUserName] = useState('there');
  const [harmony, setHarmony] = useState(50);
  const [dewStatus, setDewStatus] = useState<'none' | 'pending' | 'waiting' | 'partner-waiting' | 'revealed'>('none');
  const [receivedNug, setReceivedNug] = useState<{ type: 'silent' | 'note'; content?: string } | null>(null);
  const [showNugModal, setShowNugModal] = useState(false);

  // Onboarding Integration
  const { isUserProfileComplete, isBondProfileComplete, bond: onboardingBond, isLoading: onboardingLoading, refreshStatus } = useOnboardingStatus();
  const [showIndividualModal, setShowIndividualModal] = useState(false);
  const [showBondModal, setShowBondModal] = useState(false);
  const [hasAutoOpenedUnique, setHasAutoOpenedUnique] = useState(false);

  useEffect(() => {
    // Auto-trigger onboarding if needed (Immediate flow)
    if (!onboardingLoading && !hasAutoOpenedUnique) {
       if (!isUserProfileComplete) {
         setShowIndividualModal(true);
         setHasAutoOpenedUnique(true); // Don't spam
       } else if (isLinked && !isBondProfileComplete) {
         // Only if linked
         setShowBondModal(true);
         setHasAutoOpenedUnique(true);
       }
    }
  }, [onboardingLoading, isUserProfileComplete, isUserProfileComplete, isLinked, isBondProfileComplete, hasAutoOpenedUnique]);

  const [showSentAnimation, setShowSentAnimation] = useState(false);

  const featuredGames = getGamesByCategory('intimacy');

  useFocusEffect(
    useCallback(() => {
      if (user) {
        checkBondStatus();
      }
    }, [user])
  );

  const checkBondStatus = async () => {
    if (!user) return;
    setIsLoading(true);
    
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    
    if (myProfile?.display_name) {
      setUserName(myProfile.display_name.split(' ')[0]);
    }
    
    const { data } = await bondService.getUserBond(user.id);
    
    if (data && data.status === 'couple') {
      setIsLinked(true);
      setStreak(data.streak_count || 0);
      setBond(data);
      
      const { data: partnerProfile } = await bondService.getPartnerProfile(data, user.id);
      if (partnerProfile?.display_name) {
        setPartnerName(partnerProfile.display_name);
      }

      const { data: dewData } = await bondService.getTodayDew(data.id);
      
      if (dewData) {
        const isUser1 = data.user_1_id === user.id;
        const myResponse = isUser1 ? dewData.user_1_response : dewData.user_2_response;
        const partnerResponse = isUser1 ? dewData.user_2_response : dewData.user_1_response;
        
        if (dewData.is_revealed) {
          setDewStatus('revealed');
        } else if (myResponse && !partnerResponse) {
          setDewStatus('waiting');
        } else if (!myResponse && partnerResponse) {
          setDewStatus('partner-waiting');
        } else {
          setDewStatus('pending');
        }
      } else {
        setDewStatus('none');
      }

      const { data: nugs } = await supabase
        .from('nugs')
        .select('id')
        .eq('bond_id', data.id);
      const totalNugs = nugs?.length || 0;
      setNugsCount(totalNugs);

      const { data: dews } = await supabase
        .from('daily_dews')
        .select('is_revealed')
        .eq('bond_id', data.id);
      const dewsTotal = dews?.length || 0;
      const dewsCompleted = dews?.filter(d => d.is_revealed).length || 0;

      const streakScore = Math.min((data.streak_count || 0) * 5, 30);
      const dewScore = dewsTotal > 0 ? (dewsCompleted / dewsTotal) * 40 : 20;
      const nugScore = Math.min(totalNugs * 2, 30);
      setHarmony(Math.min(Math.round(streakScore + dewScore + nugScore), 100));

    } else {
      setIsLinked(false);
      setBond(null);
      setPartnerName('Partner');
      setDewStatus('none');
      setHarmony(50);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!bond?.id || !user) return;

    const channel = supabase
      .channel(`nugs-${bond.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nugs',
          filter: `bond_id=eq.${bond.id}`,
        },
        (payload) => {
          if (payload.new.sender_id !== user.id) {
            const nugData = payload.new as any;
            // CORRECT MAPPING: use 'type' and 'content' cols from DB
            setReceivedNug({
              type: nugData.type,
              content: nugData.content,
            });
            setShowNugModal(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bond?.id, user]);

  const handleSendNug = async (type: 'silent' | 'note', content?: string) => {
    if (!bond?.id || !user) return;
    
    const { error } = await bondService.sendNug(bond.id, user.id, type, content);
    
    if (!error) {
      setShowSentAnimation(true);
      // Optimistic update
      setNugsCount(prev => prev + 1);
    } else {
      console.error('Failed to send nug:', error);
    }
  };

  const navigateToGame = (slug: string) => {
    router.push(`/games/${slug}` as any);
  };

  const renderLinkingCard = () => (
    <TouchableOpacity 
      style={styles.linkCard}
      activeOpacity={0.9}
      onPress={() => router.push('/link')}
    >
      <LinearGradient
        colors={[colors.primary, '#FF6B6B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.linkCardGradient}
      >
        <View style={styles.linkIconContainer}>
          <Link color="white" size={28} />
        </View>
        <View style={styles.linkContent}>
          <Text style={styles.linkTitle}>Connect with your partner</Text>
          <Text style={styles.linkSubtitle}>
            Share your unique code to start your journey together
          </Text>
        </View>
        <ChevronRight color="white" size={24} />
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper variant="dawn">
      <NugSentOverlay 
        visible={showSentAnimation} 
        onAnimationComplete={() => setShowSentAnimation(false)} 
      />
      
      <FloatingHeader 
        avatarSource={require('@/src/assets/images/avatar.png')}
        onProfilePress={() => router.push('/profile')}
        onNotificationPress={() => console.log('Notifications')}
        notificationCount={dewStatus === 'partner-waiting' ? 1 : 0}
        streak={streak}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Greeting */}
        <View style={styles.heroSection}>
          <Text style={[styles.greeting, { color: colors.muted }]}>{getGreeting()},</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
        </View>

        {/* Relationship Duration (Calculated from Anniversary) */}
        {bond?.anniversary_date && (
           <RelationshipDurationCard date={bond.anniversary_date} />
        )}

        {/* Onboarding Progress Card */}
        {/* <OnboardingProgressCard 
          onOpenIndividual={() => setShowIndividualModal(true)}
          onOpenBond={() => setShowBondModal(true)}
        /> */}
        
        {!isLinked && !isLoading && renderLinkingCard()}

        {isLinked && (
          <>
            {/* Harmony Hub */}
            <TouchableOpacity 
              style={[styles.harmonyHub, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              onPress={() => router.push('/(tabs)/pulse')}
              activeOpacity={0.9}
            >
              {/* Left: Main Ring */}
              <View style={styles.hubRingContainer}>
                <HarmonyRing score={harmony} size="medium" showLabel={true} />
              </View>

              {/* Right: Metrics Stack */}
              <View style={styles.hubMetrics}>
                {/* Streak Pill */}
                <View style={[styles.hubMetricPill, { backgroundColor: isDark ? 'rgba(255,107,107,0.15)' : '#FFF5F5' }]}>
                  <View style={[styles.hubIconCircle, { backgroundColor: '#FF6B6B' }]}>
                    <Flame color="white" size={14} fill="white" />
                  </View>
                  <View>
                    <Text style={[styles.hubMetricValue, { color: colors.text }]}>{streak}</Text>
                    <Text style={[styles.hubMetricLabel, { color: colors.muted }]}>Day Streak</Text>
                  </View>
                </View>

                {/* Nugs Pill */}
                <View style={[styles.hubMetricPill, { backgroundColor: isDark ? 'rgba(255,184,0,0.15)' : '#FFFBE6' }]}>
                  <View style={[styles.hubIconCircle, { backgroundColor: '#FFB800' }]}>
                    <Heart color="white" size={14} fill="white" />
                  </View>
                  <View>
                    <Text style={[styles.hubMetricValue, { color: colors.text }]}>{nugsCount}</Text>
                    <Text style={[styles.hubMetricLabel, { color: colors.muted }]}>Nugs Sent</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Daily Dew Card */}
            <TouchableOpacity 
              style={[
                styles.dewCard,
                { backgroundColor: colors.card },
                dewStatus === 'revealed' && (isDark ? styles.dewCardCompletedDark : styles.dewCardCompleted),
                dewStatus === 'partner-waiting' && (isDark ? styles.dewCardUrgentDark : styles.dewCardUrgent),
              ]} 
              activeOpacity={0.9}
              onPress={() => router.push('/(tabs)/dew')}
            >
              <View style={styles.dewLeft}>
                <View style={[
                  styles.dewIconWrap,
                  isDark && { backgroundColor: 'rgba(255, 107, 148, 0.15)' },
                  dewStatus === 'revealed' && styles.dewIconCompleted,
                  dewStatus === 'partner-waiting' && styles.dewIconUrgent,
                ]}>
                  {dewStatus === 'revealed' ? (
                    <Check color="white" size={20} />
                  ) : (
                    <Droplets color={dewStatus === 'partner-waiting' ? 'white' : colors.primary} size={20} />
                  )}
                </View>
                <View style={styles.dewText}>
                  <Text style={[styles.dewTitle, { color: colors.text }]}>Daily Dew</Text>
                  <Text style={[styles.dewSubtitle, { color: colors.muted }]}>
                    {dewStatus === 'revealed' && 'Answered for today ✓'}
                    {dewStatus === 'waiting' && `Waiting for ${partnerName}...`}
                    {dewStatus === 'partner-waiting' && `${partnerName} is waiting!`}
                    {dewStatus === 'pending' && "Today's question is ready"}
                    {dewStatus === 'none' && 'Check back tomorrow'}
                  </Text>
                </View>
              </View>
              <View style={styles.dewRight}>
                {dewStatus === 'partner-waiting' && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>!</Text>
                  </View>
                )}
                {dewStatus === 'pending' && (
                  <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.newText}>NEW</Text>
                  </View>
                )}
                <ChevronRight color={colors.muted} size={20} />
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Featured Games */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Spice It Up 🔥</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>Turn up the heat</Text>
          </View>
          <TouchableOpacity 
            style={styles.seeAllBtn}
            onPress={() => router.push('/(tabs)/games')}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>All Games</Text>
            <ArrowRight color={colors.primary} size={16} />
          </TouchableOpacity>
        </View>
        
        {featuredGames.map((game) => (
          <GameCard
            key={game.slug}
            title={game.title}
            subtitle={game.subtitle}
            icon={GAME_ICONS[game.slug] || <Flame color="white" size={24} />}
            gradientColors={game.gradientColors}
            backgroundImage={getGameBackgroundImage(game.slug)}
            onPress={() => navigateToGame(game.slug)}
          />
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      {isLinked && (
        <NugButton onSendNug={handleSendNug} />
      )}

      <NugReceivedModal
        visible={showNugModal}
        nug={receivedNug}
        partnerName={partnerName}
        onDismiss={() => {
          setShowNugModal(false);
          setReceivedNug(null);
        }}
      />

      <IndividualOnboardingModal 
        visible={showIndividualModal} 
        onComplete={() => {
          setShowIndividualModal(false);
          refreshStatus();
          // Optional: Check if bond is next immediately?
          // For now, let the useEffect handle it on next render or user can click the card
          setHasAutoOpenedUnique(false); // Valid to allow next auto-open (e.g. bond)
        }}
      />

      <BondOnboardingModal 
        visible={showBondModal}
        bondId={onboardingBond?.id}
        onComplete={() => {
          setShowBondModal(false);
          refreshStatus();
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 110,
  },
  heroSection: {
    marginBottom: 24,
  },
  greeting: {
    fontFamily: 'Quicksand',
    fontSize: 16,
  },
  userName: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 2,
  },
  // Linking Card
  linkCard: {
    marginBottom: 24,
    borderRadius: 20,
    shadowColor: '#FF4B7D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  linkCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
  },
  linkIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontFamily: 'Outfit',
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  linkSubtitle: {
    fontFamily: 'Quicksand',
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  // Harmony Hub (New)
  harmonyHub: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    gap: 16,
    minHeight: 140, // Ensure height for the ring
  },
  hubRingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubMetrics: {
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  hubMetricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  hubIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hubMetricValue: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  hubMetricLabel: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    fontWeight: '600',
  },
  // Dew Card
  dewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  dewCardCompleted: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  dewCardCompletedDark: {
    backgroundColor: 'rgba(72, 187, 120, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(72, 187, 120, 0.3)',
  },
  dewCardUrgent: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  dewCardUrgentDark: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  dewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dewIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E8F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  dewIconCompleted: {
    backgroundColor: '#48BB78',
  },
  dewIconUrgent: {
    backgroundColor: '#FF9800',
  },
  dewText: {
    flex: 1,
  },
  dewTitle: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  dewSubtitle: {
    fontFamily: 'Quicksand',
    fontSize: 13,
  },
  dewRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgentBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentText: {
    fontFamily: 'Outfit',
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newText: {
    fontFamily: 'Outfit',
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.5,
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Outfit',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontFamily: 'Quicksand',
    fontSize: 13,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontFamily: 'Outfit',
    fontSize: 14,
    fontWeight: '600',
  },
});
