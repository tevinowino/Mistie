import { colors } from '@/src/theme/colors';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, RotateCcw, Sparkles } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    ImageBackground,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = SCREEN_WIDTH * 1.25;

interface FlashCardProps {
  prompt: string;
  cardNumber: number;
  totalCards: number;
  gradientColors: string[];
  backgroundImage?: any;
  gameTitle?: string;
  onNext?: () => void;
  onPrevious: () => void;
  onSkip?: () => void;
  onClose?: () => void;
  canGoBack?: boolean;
  hideNavigation?: boolean;
}

export function FlashCard({
  prompt,
  cardNumber,
  totalCards,
  gradientColors,
  backgroundImage,
  gameTitle,
  onNext,
  onPrevious,
  onClose,
  canGoBack = true,
  hideNavigation = false,
}: FlashCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(prompt);

  // Entrance animation on mount
  useEffect(() => {
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Reset card when prompt changes - with entrance animation
  useEffect(() => {
    if (prompt !== currentPrompt) {
      // Animate in the new card
      cardScale.setValue(0.9);
      translateX.setValue(0);
      translateY.setValue(0);
      cardOpacity.setValue(1);
      flipAnimation.setValue(0);
      setIsFlipped(false);
      setIsAnimating(false);
      setCurrentPrompt(prompt);
      
      // Spring entrance
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [prompt]);

  // Flip interpolations
  const frontRotateY = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotateY = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const flipCard = useCallback(() => {
    if (isAnimating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.spring(flipAnimation, {
      toValue: isFlipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  }, [isFlipped, isAnimating, flipAnimation]);

  // Handle swipe/nav
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (isAnimating) return;
    
    if (direction === 'right' && (!canGoBack || cardNumber <= 1)) {
      Animated.spring(translateX, {
        toValue: 0,
        friction: 6,
        useNativeDriver: true,
      }).start();
      return;
    }
    
    setIsAnimating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const swipeOutDistance = direction === 'left' ? -SCREEN_WIDTH * 1.2 : SCREEN_WIDTH * 1.2;
    
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: swipeOutDistance,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (direction === 'left') {
        onNext?.();
      } else {
        onPrevious();
      }
    });
  }, [isAnimating, canGoBack, cardNumber, onNext, onPrevious, translateX, cardOpacity, hideNavigation]);

  // Pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return (
          !isAnimating &&
          !isFlipped &&
          Math.abs(gesture.dx) > 10 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5
        );
      },
      onPanResponderGrant: () => {
        Animated.spring(cardScale, {
          toValue: 0.98,
          friction: 8,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gesture) => {
        translateX.setValue(gesture.dx);
        translateY.setValue(gesture.dy * 0.25);
      },
      onPanResponderRelease: (_, gesture) => {
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }).start();
        
        if (gesture.dx > SWIPE_THRESHOLD) {
          handleSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          handleSwipe('left');
        } else {
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              friction: 6,
              useNativeDriver: true,
            }),
            Animated.spring(translateY, {
              toValue: 0,
              friction: 6,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const cardRotate = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-6deg', '0deg', '6deg'],
    extrapolate: 'clamp',
  });

  // Progress percentage
  const progressPercent = (cardNumber / totalCards) * 100;

  const renderCardContent = (isFront: boolean) => (
    <View style={styles.cardContent}>
      {/* Game title badge */}
      {gameTitle && isFront && (
        <View style={[styles.gameBadge, { backgroundColor: `${gradientColors[0]}90` }]}>
          <Sparkles color="white" size={12} />
          <Text style={styles.gameBadgeText}>{gameTitle}</Text>
        </View>
      )}
      
      {/* Prompt text */}
      <View style={styles.promptContainer}>
        {isFront ? (
          <Text style={styles.promptText}>{currentPrompt}</Text>
        ) : (
          <>
            <Text style={styles.reflectTitle}>💭 Reflect</Text>
            <Text style={styles.reflectText}>
              Take a moment to think about this together...
            </Text>
            <Text style={styles.promptTextBack}>"{currentPrompt}"</Text>
          </>
        )}
      </View>
      
      {/* Flip hint */}
      {isFront && (
        <TouchableOpacity 
          style={styles.flipHint} 
          onPress={flipCard}
          activeOpacity={0.8}
        >
          <RotateCcw color="rgba(255,255,255,0.7)" size={16} />
          <Text style={styles.flipHintText}>Tap to reflect</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCard = (isFront: boolean, rotateY: Animated.AnimatedInterpolation<string>) => {
    const cardContent = (
      <LinearGradient
        colors={
          isFront
            ? backgroundImage 
              ? [`${gradientColors[0]}20`, `${gradientColors[0]}60`, `${gradientColors[1]}CC`]
              : (gradientColors as [string, string])
            : [gradientColors[1], gradientColors[0]] as [string, string]
        }
        locations={backgroundImage && isFront ? [0, 0.4, 1] : undefined}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.cardGradient}
      >
        {renderCardContent(isFront)}
      </LinearGradient>
    );

    return (
      <Animated.View
        style={[
          styles.card,
          !isFront && styles.cardBack,
          {
            transform: [{ rotateY }],
            backfaceVisibility: 'hidden',
          },
        ]}
      >
        {backgroundImage && isFront ? (
          <ImageBackground
            source={backgroundImage}
            style={styles.cardImageBg}
            imageStyle={styles.cardImage}
            resizeMode="cover"
          >
            {cardContent}
          </ImageBackground>
        ) : (
          cardContent
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Enhanced Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {cardNumber} of {totalCards}
          </Text>
          <Text style={styles.progressPercent}>{Math.round(progressPercent)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={gradientColors as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progressPercent}%` }]}
          />
        </View>
      </View>

      {/* Card */}
      <View style={styles.cardWrapper}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.cardContainer,
            {
              transform: [
                { translateX },
                { translateY },
                { rotate: cardRotate },
                { scale: cardScale },
              ],
              opacity: cardOpacity,
            },
          ]}
        >
          {renderCard(true, frontRotateY)}
          {renderCard(false, backRotateY)}
        </Animated.View>
      </View>

      {/* Navigation */}
      {!hideNavigation && (
        <View style={styles.navContainer}>
          <TouchableOpacity
            style={[
              styles.navButton,
              (!canGoBack || cardNumber <= 1) && styles.navButtonDisabled,
            ]}
            onPress={() => handleSwipe('right')}
            disabled={!canGoBack || cardNumber <= 1}
          >
            <ChevronLeft color={canGoBack && cardNumber > 1 ? colors.text : colors.muted} size={22} />
            <Text style={[
              styles.navButtonText,
              (!canGoBack || cardNumber <= 1) && styles.navButtonTextDisabled,
            ]}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.swipeHintText}>
            Swipe to navigate
          </Text>

          <TouchableOpacity
            style={[styles.navButton, !onNext && styles.navButtonDisabled]}
            onPress={() => onNext && handleSwipe('left')}
            disabled={!onNext}
          >
            <Text style={[styles.navButtonText, !onNext && styles.navButtonTextDisabled]}>Next</Text>
            <ChevronRight color={onNext ? colors.text : colors.muted} size={22} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontFamily: 'Outfit',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  progressPercent: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    color: colors.muted,
  },
  progressBar: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 16,
    overflow: 'hidden',
  },
  cardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cardImageBg: {
    flex: 1,
  },
  cardImage: {
    borderRadius: 32,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 32,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  gameBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  gameBadgeText: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  promptText: {
    fontFamily: 'Outfit',
    fontSize: 26,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    lineHeight: 36,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  promptTextBack: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 20,
    fontStyle: 'italic',
  },
  reflectTitle: {
    fontFamily: 'Outfit',
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  reflectText: {
    fontFamily: 'Quicksand',
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  flipHintText: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 24,
    gap: 4,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontFamily: 'Outfit',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  navButtonTextDisabled: {
    color: colors.muted,
  },
  swipeHintText: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    color: colors.muted,
  },
});
