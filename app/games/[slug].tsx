import { BottleSpinner } from '@/src/components/games/BottleSpinner';
import { ChoiceCard } from '@/src/components/games/ChoiceCard';
import { FlashCard } from '@/src/components/games/FlashCard';
import { GameSetup } from '@/src/components/games/GameSetup';
import { HeatControl } from '@/src/components/games/HeatControl';
import { InputCard } from '@/src/components/games/InputCard';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { useAuth } from '@/src/context/AuthContext';
import { useGameSession } from '@/src/hooks/useGameSession';
import { bondService } from '@/src/services/bondService';
import { colors } from '@/src/theme/colors';
import { getGameBackgroundImage } from '@/src/utils/gameImages';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, RefreshCw, Wifi, WifiOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getHeatColors = (level: number, defaultColors: [string, string]): [string, string] => {
  switch (level) {
    case 1: return ['#4CAF50', '#00796B']; // Mild
    case 2: return ['#FF9800', '#F57C00']; // Spicy
    case 3: return ['#D32F2F', '#B71C1C']; // Inferno
    default: return defaultColors;
  }
};

// Game metadata for display
const GAME_META: Record<string, { 
  title: string; 
  gradientColors: [string, string];
  description: string;
}> = {
  'crush': {
    title: 'Crush',
    gradientColors: ['#EC407A', '#D81B60'],
    description: 'Flirty prompts to spark romance',
  },
  'deep-night': {
    title: 'Deep Night',
    gradientColors: ['#5C6BC0', '#3949AB'],
    description: 'Late-night confessions and deep sharing',
  },
  'is-it-okay': {
    title: 'Is it Okay?',
    gradientColors: ['#26A69A', '#00897B'],
    description: 'Controversial questions for healthy debate',
  },
  'connected': {
    title: 'Connected',
    gradientColors: ['#42A5F5', '#1E88E5'],
    description: 'Strengthen your emotional foundations',
  },
  'whos-more-likely': {
    title: "Who's More Likely",
    gradientColors: ['#AB47BC', '#8E24AA'],
    description: 'Compare perceptions about each other',
  },
  'memory-lane': {
    title: 'Memory Lane',
    gradientColors: ['#66BB6A', '#43A047'],
    description: 'Journey through your milestones',
  },
  'mirror': {
    title: 'Mirror',
    gradientColors: ['#29B6F6', '#039BE5'],
    description: 'How well do you know your partner?',
  },
  'tell-me-everything': {
    title: 'Tell Me Everything',
    gradientColors: ['#FFCA28', '#FFB300'],
    description: 'Total transparency prompts',
  },
  'between-us': {
    title: 'Between Us',
    gradientColors: ['#26C6DA', '#00ACC1'],
    description: 'Wildcard mix of topics',
  },
  'would-you-rather': {
    title: 'Would You Rather',
    gradientColors: ['#FFA726', '#FB8C00'],
    description: 'Classic dilemma choices',
  },
  'would-you-rather-hot': {
    title: 'Would You Rather Hot',
    gradientColors: ['#E53935', '#C62828'],
    description: 'Uncensored intimacy dilemmas',
  },
  'intimacy': {
    title: 'Intimacy',
    gradientColors: ['#AD1457', '#880E4F'],
    description: 'Build physical and emotional heat',
  },
  'hard-dare': {
    title: 'Hard-Dare',
    gradientColors: ['#6A1B9A', '#4A148C'],
    description: 'Boundary-pushing challenges',
  },
};

// Fallback demo prompts for when AI generation fails
const DEMO_PROMPTS: Record<string, string[]> = {
  'crush': [
    "What's the first thing you noticed about your partner?",
    "What song reminds you of your relationship?",
    "What's a small thing your partner does that makes you smile?",
    "If you could relive one moment with your partner, which would it be?",
    "What's the most romantic thing you've ever done together?",
    "What's your favorite inside joke?",
    "What quality of your partner do you admire most?",
    "What made you realize you were falling for them?",
    "What's your partner's love language?",
    "What adventure would you love to have together?",
  ],
  'deep-night': [
    "What fear have you never told anyone about?",
    "What's a dream you've given up on?",
    "What do you think happens after we die?",
    "What's your biggest regret in life so far?",
    "What childhood memory shaped who you are today?",
    "What are you most insecure about?",
    "What's a secret you've kept for years?",
    "If you could change one thing about your past, what would it be?",
    "What do you want your legacy to be?",
    "What's the hardest thing you've ever had to do?",
  ],
  'is-it-okay': [
    "Is it okay to keep secrets from your partner?",
    "Is it okay to stay friends with an ex?",
    "Is it okay to go through your partner's phone?",
    "Is it okay to have a 'celebrity pass'?",
    "Is it okay to lie to protect someone's feelings?",
    "Is it okay to have separate bank accounts?",
    "Is it okay to flirt with others while in a relationship?",
    "Is it okay to keep photos of your ex?",
    "Is it okay to have friends of the opposite sex?",
    "Is it okay to spend holidays apart?",
  ],
  'connected': [
    "What's one goal we should work on together?",
    "How can I better support you?",
    "What's something new you'd like us to try?",
    "Where do you see us in 5 years?",
    "What's your favorite memory of us?",
    "How has our relationship changed you?",
    "What do you appreciate most about our relationship?",
    "What's something you wish I knew about you?",
    "How do you feel most loved by me?",
    "What's a challenge we've overcome together?",
  ],
  'whos-more-likely': [
    "Who's more likely to cry during a movie?",
    "Who's more likely to forget an anniversary?",
    "Who's more likely to get lost?",
    "Who's more likely to start an argument?",
    "Who's more likely to apologize first?",
    "Who's more likely to spend too much money?",
    "Who's more likely to dance in public?",
    "Who's more likely to burn dinner?",
    "Who's more likely to get jealous?",
    "Who's more likely to oversleep?",
  ],
  'memory-lane': [
    "Where was our first date?",
    "What were you wearing when we first met?",
    "What was the first gift you gave me?",
    "What's the funniest thing that happened on our vacation?",
    "When did you first say 'I love you'?",
    "What was our biggest fight about?",
    "What's the craziest adventure we've had?",
    "What was playing when we first danced together?",
    "What's the most romantic thing I've done for you?",
    "What challenge did we overcome together?",
  ],
  'mirror': [
    "What's my biggest fear?",
    "What's my favorite comfort food?",
    "What's my dream vacation destination?",
    "What's my pet peeve?",
    "What's my love language?",
    "What makes me laugh the most?",
    "What's my guilty pleasure?",
    "What's my favorite movie?",
    "What stresses me out the most?",
    "What's my happiest childhood memory?",
  ],
  'tell-me-everything': [
    "Tell me about your first heartbreak.",
    "Tell me about a time you felt truly free.",
    "Tell me about your relationship with your parents.",
    "Tell me about a time you surprised yourself.",
    "Tell me about your darkest moment and how you got through it.",
    "Tell me about a time you had to be brave.",
    "Tell me about something you've never told anyone.",
    "Tell me about a dream you're chasing.",
    "Tell me about a moment that changed your perspective.",
    "Tell me about someone who shaped who you are.",
  ],
  'between-us': [
    "What's the weirdest thing you've ever eaten?",
    "What's a belief you've completely changed your mind about?",
    "If you could have dinner with anyone, dead or alive, who?",
    "What's your most embarrassing moment?",
    "If you won the lottery, what's the first thing you'd buy?",
    "What's a skill you wish you had?",
    "What's the best advice you've ever received?",
    "What's something you're irrationally afraid of?",
    "What's your hot take that most people disagree with?",
    "If you could live in any era, which would it be?",
  ],
  'would-you-rather': [
    "Would you rather travel the world or have a mansion?",
    "Would you rather be able to fly or be invisible?",
    "Would you rather give up social media or TV forever?",
    "Would you rather live without music or without movies?",
    "Would you rather have unlimited money or unlimited time?",
    "Would you rather always be 10 minutes late or 20 minutes early?",
    "Would you rather know how you die or when you die?",
    "Would you rather be famous or rich?",
    "Would you rather lose all your memories or never make new ones?",
    "Would you rather have a rewind or pause button for life?",
  ],
  'would-you-rather-hot': [
    "Would you rather give a sensual massage or receive one?",
    "Would you rather be blindfolded or handcuffed?",
    "Would you rather whisper sweet nothings or have them whispered to you?",
    "Would you rather role-play strangers or boss/employee?",
    "Would you rather have a slow and sensual night or a wild one?",
    "Would you rather be seduced in the kitchen or the bedroom?",
    "Would you rather use whipped cream or chocolate?",
    "Would you rather leave a love bite or receive one?",
    "Would you rather be dominant or submissive tonight?",
    "Would you rather try something new or perfect something you love?",
  ],
  'intimacy': [
    "What's your biggest fantasy you haven't shared yet?",
    "What do I do that drives you wild?",
    "Where's the most adventurous place you'd like to be intimate?",
    "What's something you want me to do more often?",
    "What song puts you in the mood?",
    "What's your favorite thing about our physical connection?",
    "What's one thing you've always wanted to try?",
    "How do you feel most desired by me?",
    "What's your definition of a perfect intimate evening?",
    "What's the most attractive thing about me?",
  ],
  'hard-dare': [
    "Kiss your partner for 30 seconds without stopping.",
    "Give your partner a 2-minute shoulder massage.",
    "Whisper something seductive in your partner's ear.",
    "Slow dance together without any music.",
    "Feed your partner something blindfolded.",
    "Write a love note and read it to your partner.",
    "Give your partner three genuine compliments.",
    "Hold eye contact for 60 seconds without looking away.",
    "Give your partner a forehead kiss and tell them why you love them.",
    "Let your partner control the next song and dance to it together.",
  ],
};

export default function GamePlay() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  
  // Local state for initial bond fetch
  const [bondId, setBondId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>('Partner');
  const [myName, setMyName] = useState<string>('Me');
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const gameMeta = slug ? GAME_META[slug] : null;

  // Fetch bond on mount
  useEffect(() => {
    if (user) {
      fetchBond();
    }
  }, [user]);

  const fetchBond = async () => {
    if (!user) return;
    try {
      const { data: bond } = await bondService.getUserBond(user.id);
      if (bond) {
        setBondId(bond.id);
        
        // Get partner's name for interactive games
        const isUser1 = bond.user_1_id === user.id;
        if (isUser1 && bond.user_2_profile?.display_name) {
          setPartnerName(bond.user_2_profile.display_name);
        } else if (!isUser1 && bond.user_1_profile?.display_name) {
          setPartnerName(bond.user_1_profile.display_name);
        }
        
        // Set my name from profile if available
        const myProfile = isUser1 ? bond.user_1_profile : bond.user_2_profile;
        if (myProfile?.display_name) {
          setMyName(myProfile.display_name);
        }
      } else {
        setInitError('You need to be connected with a partner to play games.');
      }
    } catch (err) {
      setInitError('Failed to load bond');
    } finally {
      setInitLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  // Use real-time game session hook once we have bondId
  const {
    prompts,
    currentIndex,
    isLoading,
    isGenerating,
    error,
    partnerConnected,
    myAnswer,
    partnerAnswer,
    goToNext,
    goToPrevious,
    refreshPrompts,
    submitAnswer,
    configNeeded,
    gameType,
    startGame,
    updateSessionConfig,
    session,
    // Spin state for Hard Dare
    spinResult,
    spinComplete,
    isSpinning,
    isUser1,
    initiateSpin,
  } = useGameSession({
    bondId: bondId || '',
    gameTypeSlug: slug || '',
  });



  const handleRefresh = () => {
    refreshPrompts();
  };

  // Initial loading or bond error
  if (initLoading) {
    return (
      <ScreenWrapper variant="dusk">
        <View style={styles.loadingContainer}>
          <View style={styles.cardStack}>
            {[2, 1, 0].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.loadingCard,
                  {
                    transform: [
                      { translateY: index * -6 },
                      { scale: 1 - index * 0.03 },
                    ],
                    opacity: 1 - index * 0.2,
                    zIndex: 3 - index,
                  },
                ]}
              >
                <LinearGradient
                  colors={gameMeta?.gradientColors || ['#7C4DFF', '#651FFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loadingCardGradient}
                />
              </Animated.View>
            ))}
          </View>
          <Text style={styles.loadingTitle}>Loading...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (initError || error) {
    return (
      <ScreenWrapper variant="dusk">
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{initError || error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  // Configuration needed?
  if (configNeeded && gameType) {
    return (
      <GameSetup 
        gameType={gameType}
        onStart={startGame}
        onCancel={handleClose}
      />
    );
  }

  // Loading state
  if (isLoading || isGenerating) {
    return (
      <ScreenWrapper variant="dusk">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{gameMeta?.title || 'Game'}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.loadingContainer}>
          {/* Animated card stack */}
          <View style={styles.cardStack}>
            {[2, 1, 0].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.loadingCard,
                  {
                    transform: [
                      { translateY: index * -6 },
                      { scale: 1 - index * 0.03 },
                    ],
                    opacity: 1 - index * 0.2,
                    zIndex: 3 - index,
                  },
                ]}
              >
                <LinearGradient
                  colors={gameMeta?.gradientColors || ['#7C4DFF', '#651FFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loadingCardGradient}
                >
                  {index === 0 && (
                    <View style={styles.loadingCardContent}>
                      <View style={styles.loadingDotsContainer}>
                        <View style={[styles.loadingDot, styles.loadingDot1]} />
                        <View style={[styles.loadingDot, styles.loadingDot2]} />
                        <View style={[styles.loadingDot, styles.loadingDot3]} />
                      </View>
                    </View>
                  )}
                </LinearGradient>
              </Animated.View>
            ))}
          </View>

          {/* Loading text */}
          <View style={styles.loadingTextContainer}>
            <Text style={styles.loadingTitle}>
              {isGenerating ? '✨ Creating Magic' : 'Loading Game'}
            </Text>
            <Text style={styles.loadingSubtitle}>
              {isGenerating 
                ? 'Generating unique prompts just for you...' 
                : 'Preparing your game experience...'}
            </Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // Error state
  if (error) {
    return (
      <ScreenWrapper variant="dusk">
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={refreshPrompts}>
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButtonAlt} onPress={handleClose}>
            <Text style={styles.closeButtonAltText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  // Use demo prompts as fallback if no prompts from API
  const effectivePrompts = prompts.length > 0 
    ? prompts 
    : (slug && DEMO_PROMPTS[slug] 
        ? DEMO_PROMPTS[slug].map((text, i) => ({ 
            id: `demo-${i}`, 
            prompt_text: text, 
            game_type_id: '', 
            bond_id: bondId || '',
            heat_level: session?.heat_level || 1,
            mode: session?.mode || 'in_person',
            is_used: false,
            created_at: new Date().toISOString()
          }))
        : []);

  // No prompts state (only if both API and demo prompts are empty)
  if (effectivePrompts.length === 0) {
    return (
      <ScreenWrapper variant="dusk">
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No prompts available.</Text>
          <TouchableOpacity style={styles.errorButton} onPress={handleRefresh}>
            <RefreshCw color="white" size={20} />
            <Text style={styles.errorButtonText}>Generate Prompts</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  // Ensure currentIndex is within bounds
  const safeIndex = Math.min(currentIndex, effectivePrompts.length - 1);
  const currentPrompt = effectivePrompts[safeIndex >= 0 ? safeIndex : 0];

  // Safety check - shouldn't happen but prevents crash
  if (!currentPrompt) {
    return (
      <ScreenWrapper variant="dusk">
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Loading prompts...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const activeColors = (gameType?.has_spice_meter && session)
    ? getHeatColors(session.heat_level, gameMeta?.gradientColors || ['#7C4DFF', '#651FFF'])
    : (gameMeta?.gradientColors || ['#7C4DFF', '#651FFF']);

  return (
    <ScreenWrapper variant="dusk">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{gameMeta?.title || 'Game'}</Text>
          <View style={styles.syncIndicator}>
            {partnerConnected ? (
              <>
                <Wifi color="#22C55E" size={12} />
                <Text style={styles.syncText}>{partnerName} connected</Text>
              </>
            ) : (
              <>
                <WifiOff color={colors.muted} size={12} />
                <Text style={[styles.syncText, { color: colors.muted }]}>Waiting for {partnerName}...</Text>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <RefreshCw color={colors.muted} size={20} />
        </TouchableOpacity>
      </View>

      {/* Card - use ChoiceCard for whos-more-likely, FlashCard for others */}
      <View style={styles.cardArea}>
        {slug === 'mirror' ? (
          <InputCard
            key={currentPrompt.id}
            prompt={currentPrompt.prompt_text}
            cardNumber={currentIndex + 1}
            totalCards={effectivePrompts.length}
            gradientColors={activeColors}
            onNext={goToNext}
            onPrevious={goToPrevious}
            canGoBack={currentIndex > 0}
            onClose={handleClose}
            onSubmit={submitAnswer}
            myName={myName}
            partnerName={partnerName}
            myAnswer={myAnswer}
            partnerAnswer={partnerAnswer}
          />
        ) : slug === 'whos-more-likely' || slug === 'is-it-okay' ? (
          <ChoiceCard
            key={currentPrompt.id}
            prompt={slug === 'whos-more-likely' 
              ? currentPrompt.prompt_text.replace("Who's more likely to ", '').replace('?', '') 
              : currentPrompt.prompt_text}
            cardNumber={currentIndex + 1}
            totalCards={effectivePrompts.length}
            gradientColors={slug === 'is-it-okay' ? (gameMeta?.gradientColors || ['#26A69A', '#00897B']) : activeColors}
            onNext={goToNext}
            onPrevious={goToPrevious}
            canGoBack={currentIndex > 0}
            myName={slug === 'whos-more-likely' ? myName : 'Okay'}
            partnerName={slug === 'whos-more-likely' ? partnerName : 'Not Okay'}
            questionLabel={slug === 'whos-more-likely' ? "Who's more likely to..." : "Is it okay if..."}
            agreeOnMatch={slug === 'is-it-okay'}
            myChoice={myAnswer as 'me' | 'partner' | null}
            partnerChoice={partnerAnswer as 'me' | 'partner' | null}
            onSelect={(choice) => submitAnswer(choice)}
            onClose={handleClose}
          />
        ) : slug === 'hard-dare' ? (
          <View style={{ flex: 1 }}>
            <FlashCard
              key={currentPrompt.id}
              prompt={currentPrompt.prompt_text}
              cardNumber={currentIndex + 1}
              totalCards={effectivePrompts.length}
              gradientColors={activeColors}
              backgroundImage={getGameBackgroundImage(slug as string)}
              gameTitle={gameMeta?.title}
              onNext={spinComplete ? goToNext : undefined}
              onPrevious={goToPrevious}
              canGoBack={currentIndex > 0}
              onClose={handleClose}
              hideNavigation={!spinComplete}
            />
            {/* Bottle Spinner Overlay */}
            <View style={styles.spinnerOverlay}>
              <BottleSpinner
                myName={myName}
                partnerName={partnerName}
                isUser1={isUser1}
                spinResult={spinResult}
                isSpinning={isSpinning}
                spinComplete={spinComplete}
                onSpin={initiateSpin}
                onContinue={spinComplete ? goToNext : undefined}
                disabled={isSpinning || !!spinResult}
              />
            </View>
          </View>
        ) : (
          <FlashCard
            key={currentPrompt.id}
            prompt={currentPrompt.prompt_text}
            cardNumber={currentIndex + 1}
            totalCards={effectivePrompts.length}
            gradientColors={activeColors}
            backgroundImage={getGameBackgroundImage(slug as string)}
            gameTitle={gameMeta?.title}
            onNext={goToNext}
            onPrevious={goToPrevious}
            canGoBack={currentIndex > 0}
            onClose={handleClose}
          />
        )}
      </View>

      {/* Heat Control Dropdown */}
      {gameType?.has_spice_meter && session && (
        <HeatControl 
          currentLevel={session.heat_level} 
          currentMode={session.mode || 'in_person'}
          onUpdate={(settings) => updateSessionConfig(settings)} 
          style={{ top: 60 }}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  spinnerOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontFamily: 'Outfit',
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  syncText: {
    fontFamily: 'Quicksand',
    fontSize: 11,
    color: '#22C55E',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArea: {
    flex: 1,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  cardStack: {
    width: SCREEN_WIDTH - 80,
    height: SCREEN_WIDTH * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  loadingCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingCardGradient: {
    flex: 1,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDotsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  loadingDot1: {
    opacity: 0.4,
  },
  loadingDot2: {
    opacity: 0.7,
  },
  loadingDot3: {
    opacity: 1,
  },
  loadingTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingTitle: {
    fontFamily: 'Outfit',
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  loadingGradient: {
    width: '100%',
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 20,
  },
  loadingSubtext: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },
  errorButtonText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  closeButtonAlt: {
    marginTop: 16,
    paddingVertical: 12,
  },
  closeButtonAltText: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: colors.muted,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    marginTop: 20,
  },
  retryText: {
    color: 'white',
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '600',
  },
});
