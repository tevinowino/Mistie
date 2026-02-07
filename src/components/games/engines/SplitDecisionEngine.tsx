import { TutorialOverlay } from '@/src/components/games/tutorials/TutorialOverlay';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronRight, Split } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameEngineProps } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const OptionBlock = ({
  text,
  color,
  borderColor,
  isSelected,
  isPartnerChoice,
  onPress,
  disabled,
  position, // 'top' | 'bottom'
}: {
  text: string;
  color: string;
  borderColor: string;
  isSelected: boolean;
  isPartnerChoice: boolean;
  onPress: () => void;
  disabled: boolean;
  position: 'top' | 'bottom';
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.optionContainer, animatedStyle]}>
      <TouchableOpacity
        style={[styles.optionButton, { 
            backgroundColor: color, // translucent glass fill
            borderColor: borderColor, 
        }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled}
      >
        <View style={styles.optionContent}>
          <Text style={styles.optionText}>{text}</Text>
          
          {/* My Selection Indicator */}
          {isSelected && (
            <Animated.View entering={ZoomIn} style={styles.mySelectionBadge}>
              <Check color={color} size={16} strokeWidth={3} />
              <Text style={[styles.badgeText, { color }]}>My Choice</Text>
            </Animated.View>
          )}

          {/* Partner Selection Indicator */}
          {isPartnerChoice && (
            <Animated.View entering={ZoomIn.delay(300)} style={styles.partnerSelectionBadge}>
              <Text style={styles.partnerBadgeText}>Partner Picked</Text>
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const SplitDecisionEngine: React.FC<GameEngineProps> = ({
  prompts,
  currentIndex,
  submitAnswer,
  myAnswer,
  partnerAnswer,
  onNext,
  hasSeenTutorial,
  markTutorialSeen,
  backgroundImage,
}) => {
  const insets = useSafeAreaInsets();
  const currentPrompt = prompts[currentIndex];
  
  // Parse options from prompt text usually formatted as "Option A or Option B"
  // If your prompt structure is different, adjust here. 
  // Assuming "Would you rather [A] or [B]?"
  // A simple split by " or " might work for now, but ideally the AI returns structured JSON.
  // Fallback to naive splitting for legacy prompts.
  // Use pre-parsed options if available, otherwise parse from text
  const promptText = currentPrompt?.prompt_text || "Loading... or Loading...";
  
  let optionA = currentPrompt?.option_a;
  let optionB = currentPrompt?.option_b;

  if (!optionA || !optionB) {
    const parts = promptText.replace(/Would you rather /i, '').split(/ or /i);
    optionA = parts[0] || "Option A";
    optionB = parts.slice(1).join(" or ") || "Option B";
  }

  const [showTutorial, setShowTutorial] = useState(!hasSeenTutorial);

  useEffect(() => {
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [hasSeenTutorial]);

  const handleSelect = (option: 'A' | 'B') => {
    if (myAnswer) return; // Already answered
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // Store simple "A" or "B" or full text? 
    // Storing "A" or "B" is safer for matching logic.
    submitAnswer(option);
  };

  const isMatch = myAnswer && partnerAnswer && myAnswer === partnerAnswer;
  const isDone = !!(myAnswer && partnerAnswer);

  return (
    <View style={styles.container}>
      {/* Background Image or Fallback */}
      {backgroundImage ? (
         <ImageBackground 
            source={backgroundImage} 
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            blurRadius={20} // Heavy blur for liquid feel background
          />
      ) : (
        <LinearGradient
            colors={['#1a1a1a', '#2d2d2d']}
            style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* Top Option (A) - Liquid Glass */}
      <View style={styles.halfContainer}>
        <OptionBlock
          text={optionA}
          color="rgba(255, 107, 107, 0.2)" // Glassy Red tint
          borderColor="rgba(255, 107, 107, 0.5)"
          isSelected={myAnswer === 'A'}
          isPartnerChoice={isDone && partnerAnswer === 'A'}
          onPress={() => handleSelect('A')}
          disabled={!!myAnswer}
          position="top"
        />
      </View>

      {/* OR Divider - Glass Orb */}
      <View style={styles.dividerContainer} pointerEvents="none">
        <View style={styles.glassOrb}>
          <Text style={styles.dividerText}>OR</Text>
        </View>
      </View>

      {/* Bottom Option (B) - Liquid Glass */}
      <View style={styles.halfContainer}>
        <OptionBlock
          text={optionB}
          color="rgba(78, 205, 196, 0.2)" // Glassy Teal tint
          borderColor="rgba(78, 205, 196, 0.5)"
          isSelected={myAnswer === 'B'}
          isPartnerChoice={isDone && partnerAnswer === 'B'}
          onPress={() => handleSelect('B')}
          disabled={!!myAnswer}
          position="bottom"
        />
      </View>

      {/* Result Overlay */}
      {isDone && (
        <Animated.View entering={FadeIn.delay(500)} style={[styles.resultOverlay, { bottom: insets.bottom + 100 }]}>
          <LinearGradient
            colors={isMatch ? ['#20BF55', '#01BAEF'] : ['#FF9966', '#FF5E62']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.resultToast}
          >
            <Text style={styles.resultText}>
              {isMatch ? "It's a Match! 🎉" : "Different Views! 🤷‍♂️"}
            </Text>
          </LinearGradient>
          
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={onNext}
          >
            <Text style={styles.nextButtonText}>Next Card</Text>
            <ChevronRight color="white" size={20} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Waiting Indicator */}
      {myAnswer && !partnerAnswer && (
        <Animated.View entering={FadeIn} style={[styles.waitingPill, { bottom: insets.bottom + 40 }]}>
          <Text style={styles.waitingText}>Waiting for partner...</Text>
        </Animated.View>
      )}

      {/* Tutorial */}
      {showTutorial && (
        <TutorialOverlay
          gameSlug="split-decision"
          onDismiss={() => {
            setShowTutorial(false);
            markTutorialSeen();
          }}
          content={{
            title: "Split Decision",
            description: "Tap the top or bottom to choose your preference. Try to match with your partner!",
            icon: <Split color="white" size={40} />,
            gradientColors: ['#FF6B6B', '#4ECDC4']
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  halfContainer: {
    flex: 1,
    padding: 12, // Gap for floating glass effect
  },
  optionContainer: {
    flex: 1,
    borderRadius: 30, // Large rounded corners for liquid feel
    overflow: 'hidden',
  },
  optionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(255,255,255,0.05)', // Base glass
    borderWidth: 1,
    borderRadius: 30,
  },
  optionContent: {
    alignItems: 'center',
    gap: 16,
  },
  optionText: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  mySelectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  badgeText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '800',
  },
  partnerSelectionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  partnerBadgeText: {
    fontFamily: 'Quicksand',
    fontSize: 13,
    color: 'white',
    fontWeight: '600',
  },
  dividerContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30, 
    zIndex: 10,
  },
  glassOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)', // Glass orb
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    backdropFilter: 'blur(10px)', // Web support
  },
  dividerText: {
    fontFamily: 'Outfit',
    fontWeight: '900',
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
  },
  resultOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    gap: 16,
    zIndex: 20,
  },
  resultToast: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  resultText: {
    fontFamily: 'Outfit',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  nextButtonText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  waitingPill: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    zIndex: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  waitingText: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
});
