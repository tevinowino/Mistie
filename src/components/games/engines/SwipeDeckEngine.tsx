import { TutorialOverlay } from '@/src/components/games/tutorials/TutorialOverlay';
import { getGameBackgroundImage } from '@/src/utils/gameImages';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, Hand, Heart } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { GameEngineProps } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface ExtendedGameEngineProps extends GameEngineProps {
    gameSlug?: string;
}

// Define colors locally for now
const colors = {
  text: '#1F2937',
  muted: '#9CA3AF',
};

// ... existing code ...

export const SwipeDeckEngine: React.FC<ExtendedGameEngineProps> = ({
  prompts,
  currentIndex,
  onNext,
  onPrevious,
  hasSeenTutorial,
  markTutorialSeen,
  isUser1,
  gameSlug = 'crush', // Default to crush
}) => {
  const [showTutorial, setShowTutorial] = useState(!hasSeenTutorial);
  const currentPrompt = prompts[currentIndex];
  // Calculate next prompt for background card
  const nextPrompt = prompts[currentIndex + 1];
  const backgroundImage = getGameBackgroundImage(gameSlug);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);

  useEffect(() => {
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [hasSeenTutorial]);

  // Reset animation when currentIndex changes
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    cardScale.value = 1;
    cardOpacity.value = 1;
  }, [currentIndex]);

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Do NOT reset values here. Wait for effect.
    onNext();
  };

  const manualSwipe = (direction: 'left' | 'right') => {
    const destination = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    
    translateX.value = withSpring(destination, {
        damping: 15,
        stiffness: 120, // Snappier
        velocity: 5
    }, (finished) => {
        if (finished) {
            runOnJS(handleSwipeComplete)(direction);
        }
    });
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      cardScale.value = withSpring(0.98);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.5; // Restrict vertical movement
    })
    .onEnd((event) => {
      cardScale.value = withSpring(1);
      
      // Use velocity to help fling
      const velocityX = event.velocityX;
      
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD || Math.abs(velocityX) > 800) {
        // Swipe Out
        const direction = (translateX.value > 0 || velocityX > 800) ? 'right' : 'left';
        
        // Fling animation
        translateX.value = withSpring(
          direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5,
          { 
             velocity: velocityX,
             stiffness: 90,
             damping: 18
          },
          () => {
            runOnJS(handleSwipeComplete)(direction);
          }
        );
      } else {
        // Return to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  // Animated Styles for Top Card
  const topCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${interpolate(translateX.value, [-SCREEN_WIDTH, SCREEN_WIDTH], [-10, 10])}deg` },
      { scale: cardScale.value },
    ],
    opacity: cardOpacity.value,
  }));

  // Animated Styles for Background Card (The "Stack" Effect)
  const backCardStyle = useAnimatedStyle(() => {
    // As top card moves away, bottom card scales up from 0.9 to 1
    const progress = Math.min(Math.abs(translateX.value) / (SCREEN_WIDTH * 0.5), 1);
    const scale = interpolate(progress, [0, 1], [0.92, 1], Extrapolation.CLAMP);
    const opacity = interpolate(progress, [0, 1], [0.5, 1], Extrapolation.CLAMP);
    
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Overlay Opacity (Like/Nope indicators)
  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SCREEN_WIDTH * 0.25], [0, 1]),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -SCREEN_WIDTH * 0.25], [0, 1]),
  }));

  if (!currentPrompt) return <View />;

  const gradientColors = ['#FF416C', '#FF4B2B'] as const; // Default

  const renderCardContent = (text: string) => (
      <View style={styles.cardInner}>
          <LinearGradient
            colors={backgroundImage ? ['rgba(255, 65, 108, 0.4)', 'rgba(255, 75, 43, 0.8)'] : gradientColors} 
            style={styles.gradient}
          >
             {/* Stamp Overlays (Only on top card relevant) */}
             {text === currentPrompt.prompt_text && (
                 <>
                    <Animated.View style={[styles.stamp, styles.likeStamp, likeOpacity]}>
                    <Text style={styles.likeText}>YES</Text>
                    </Animated.View>
                    <Animated.View style={[styles.stamp, styles.nopeStamp, nopeOpacity]}>
                    <Text style={styles.nopeText}>NOPE</Text>
                    </Animated.View>
                 </>
             )}

            <View style={styles.contentContainer}>
              <View style={styles.iconContainer}>
                 <Heart color="white" size={32} strokeWidth={2.5} fill="rgba(255,255,255,0.2)" /> 
              </View>
              <Text style={styles.promptText}>{text}</Text>
              
              {text === currentPrompt.prompt_text && (
                 <Text style={styles.tapHint}>Swipe right to like</Text>
              )}
            </View>
          </LinearGradient>
      </View>
  );

  return (
    <View style={styles.container}>
      {/* Background Card (Next) */}
      {nextPrompt && (
        <Animated.View style={[styles.cardContainer, styles.backCard, backCardStyle]}>
             {backgroundImage ? (
                <ImageBackground 
                    source={backgroundImage} 
                    style={styles.cardImageBg} 
                    imageStyle={styles.cardImage}
                    resizeMode="cover"
                >
                    {renderCardContent(nextPrompt.prompt_text)}
                </ImageBackground>
             ) : (
                 renderCardContent(nextPrompt.prompt_text)
             )}
        </Animated.View>
      )}

      {/* Top Card (Active) */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardContainer, topCardStyle]}>
             {backgroundImage ? (
                <ImageBackground 
                    source={backgroundImage} 
                    style={styles.cardImageBg} 
                    imageStyle={styles.cardImage}
                    resizeMode="cover"
                >
                    {renderCardContent(currentPrompt.prompt_text)}
                </ImageBackground>
             ) : (
                 renderCardContent(currentPrompt.prompt_text)
             )}
        </Animated.View>
      </GestureDetector>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
            <TouchableOpacity 
                style={[styles.actionButton, styles.navButton]} 
                onPress={onPrevious}
                disabled={currentIndex === 0}
            >
                <ChevronLeft color={currentIndex === 0 ? colors.muted : colors.text} size={32} />
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton]} 
                onPress={() => manualSwipe('right')}
            >
                <Text style={styles.nextText}>Next</Text>
                <ChevronRight color="white" size={24} />
            </TouchableOpacity>
        </View>

        {/* Tutorial */}
        {showTutorial && (
        <TutorialOverlay
          gameSlug="swipe-deck"
          onDismiss={() => {
            setShowTutorial(false);
            markTutorialSeen();
          }}
          content={{
            title: "Swipe Deck",
            description: "Swipe RIGHT to like a question, LEFT to skip it.",
            icon: <Hand color="white" size={40} />,
            gradientColors: ['#FF416C', '#FF4B2B']
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.55,
    borderRadius: 24,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: 'white', // fallback
  },
  cardInner: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardImageBg: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardImage: {
    borderRadius: 24,
  },
  backCard: {
    zIndex: 0,
    transform: [{ scale: 0.9 }],
  },
  gradient: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    gap: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  promptText: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    lineHeight: 36,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tapHint: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 20,
  },
  stamp: {
    position: 'absolute',
    top: 40,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 4,
    borderRadius: 12,
  },
  likeStamp: {
    left: 40,
    borderColor: '#4CC9F0',
    transform: [{ rotate: '-15deg' }],
  },
  nopeStamp: {
    right: 40,
    borderColor: '#F72585',
    transform: [{ rotate: '15deg' }],
  },
  likeText: {
    fontFamily: 'Outfit',
    fontSize: 32,
    fontWeight: '900',
    color: '#4CC9F0',
    textTransform: 'uppercase',
  },
  nopeText: {
    fontFamily: 'Outfit',
    fontSize: 32,
    fontWeight: '900',
    color: '#F72585',
    textTransform: 'uppercase',
  },
  actionsContainer: {
      position: 'absolute',
      bottom: 40,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 32,
      width: '100%',
  },
  actionButton: {
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
  },
  navButton: {
      backgroundColor: 'white',
      width: 64,
  },
  primaryButton: {
      backgroundColor: '#FF4B2B',
      width: 140,
      flexDirection: 'row',
  },
  nextText: {
      fontFamily: 'Outfit',
      fontWeight: 'bold',
      fontSize: 18,
      color: 'white',
      marginRight: 4,
  },
});
