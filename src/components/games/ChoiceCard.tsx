import { colors } from '@/src/theme/colors';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronLeft, ChevronRight, Lock } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_HEIGHT * 0.15;

interface ChoiceCardProps {
  prompt: string;
  cardNumber: number;
  totalCards: number;
  gradientColors: string[];
  onNext: () => void;
  onPrevious: () => void;
  onClose?: () => void;
  canGoBack?: boolean;
  // Partner info for choices
  myName?: string;
  partnerName?: string;
  questionLabel?: string;
  agreeOnMatch?: boolean; // True for "Who's more likely", false for "Is it okay" (where we want to see if we accept the prompt)
  // Selected choices (from both users)
  // For "Is It Okay": 'me' = Okay, 'partner' = Not Okay
  myChoice?: 'me' | 'partner' | null;
  partnerChoice?: 'me' | 'partner' | null;
  onSelect?: (choice: 'me' | 'partner') => void;
  mode?: 'whos-more-likely' | 'is-it-okay';
}

export function ChoiceCard({
  prompt,
  cardNumber,
  totalCards,
  gradientColors,
  onNext,
  onPrevious,
  onClose,
  canGoBack = true,
  myName = 'Me',
  partnerName = 'Partner',
  questionLabel = "Who's more likely to...",
  agreeOnMatch = false,
  myChoice = null,
  partnerChoice = null,
  onSelect,
  mode = 'whos-more-likely',
}: ChoiceCardProps) {
  const cardScale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [currentPrompt, setCurrentPrompt] = useState(prompt);
  const [selectedChoice, setSelectedChoice] = useState<'me' | 'partner' | null>(myChoice);
  const [showResult, setShowResult] = useState(false);

  // Labels based on mode
  const optionALabel = mode === 'is-it-okay' ? 'Okay' : myName;
  const optionBLabel = mode === 'is-it-okay' ? 'Not Okay' : partnerName;

  // Reset when prompt changes
  useEffect(() => {
    if (prompt !== currentPrompt) {
      setCurrentPrompt(prompt);
      setSelectedChoice(null);
      setShowResult(false);
      // Reset position
      pan.setValue({ x: 0, y: 0 });
    }
  }, [prompt]);

  // Sync with prop (e.g. from existing session or partner update)
  useEffect(() => {
    if (myChoice) setSelectedChoice(myChoice);
  }, [myChoice]);

  // Show result when both have answered
  useEffect(() => {
    if (myChoice && partnerChoice) {
      setShowResult(true);
    } else {
      setShowResult(false);
    }
  }, [myChoice, partnerChoice]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only take over if moving vertically significantly
        return Math.abs(gesture.dy) > 10;
      },
      onPanResponderGrant: () => {
        // Slight scale down when touching
        Animated.spring(cardScale, {
          toValue: 0.97,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gesture) => {
        // Only allow dragging down
        if (gesture.dy > 0) {
          Animated.event([
            null,
            { dy: pan.y }
          ], { useNativeDriver: false })(_, gesture);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        // Reset scale
        Animated.spring(cardScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        if (gesture.dy > SWIPE_THRESHOLD) {
          // Swiped down enough - close
          Animated.timing(pan.y, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onClose?.());
        } else {
          // Bounce back
          Animated.spring(pan.y, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const cardRotate = pan.y.interpolate({
    inputRange: [0, SCREEN_HEIGHT],
    outputRange: ['0deg', '45deg'],
    extrapolate: 'clamp',
  });

  const handleSelect = useCallback((choice: 'me' | 'partner') => {
    if (selectedChoice) return; // Already selected
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedChoice(choice);
    
    // Animate selection
    Animated.sequence([
      Animated.timing(cardScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
    
    onSelect?.(choice);
  }, [selectedChoice, onSelect, cardScale]);

  const handleNext = useCallback(() => {
    if (mode === 'is-it-okay' && !showResult) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // State reset happens via useEffect when prompt changes
    // Reset pan ensure it's centered
    pan.setValue({ x: 0, y: 0 });
    onNext();
  }, [onNext, pan, mode, showResult]);

  const handlePrevious = useCallback(() => {
    if (!canGoBack || cardNumber <= 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pan.setValue({ x: 0, y: 0 });
    onPrevious();
  }, [canGoBack, cardNumber, onPrevious, pan]);


  // Helper to render "Map Pins" for Is It Okay mode
  const renderPins = (option: 'me' | 'partner') => {
    if (!showResult || mode !== 'is-it-okay') return null;

    const myPin = myChoice === option;
    const partnerPin = partnerChoice === option;

    if (!myPin && !partnerPin) return null;

    return (
      <View style={styles.pinsContainer}>
        {myPin && (
          <View style={[styles.pin, { backgroundColor: '#4CC9F0' }]}>
            <Text style={styles.pinText}>{myName.charAt(0)}</Text>
          </View>
        )}
        {partnerPin && (
          <View style={[styles.pin, { backgroundColor: '#F72585', marginLeft: myPin ? -8 : 0 }]}>
            <Text style={styles.pinText}>{partnerName.charAt(0)}</Text>
          </View>
        )}
      </View>
    );
  };

  // Helper for "Who's More Likely" icons
  const getWMLIcon = (option: 'me' | 'partner') => {
      if (!showResult || mode !== 'whos-more-likely') return null;
      
      const optionIsMe = option === 'me';
      const iPickedThis = myChoice === option;
      const partnerPickedThis = partnerChoice === option;

      if (iPickedThis && partnerPickedThis) return '✅';
      if (iPickedThis) return '🙋';
      if (partnerPickedThis) return '👆';
      return null;
  }

  const isNextDisabled = mode === 'is-it-okay' && !showResult;

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressText}>
            {cardNumber} of {totalCards}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(cardNumber / totalCards) * 100}%`,
                backgroundColor: gradientColors[0],
              }
            ]} 
          />
        </View>
      </View>

      {/* Card */}
      <View style={styles.cardWrapper}>
        <Animated.View
          style={[
            styles.cardContainer,
            { 
              transform: [
                { scale: cardScale },
                { translateY: pan.y },
                { rotate: cardRotate }
              ] 
            },
          ]}
          {...panResponder.panHandlers}
        >
          <LinearGradient
            colors={gradientColors as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Question */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionLabel}>{questionLabel}</Text>
              <Text style={styles.promptText}>{currentPrompt}</Text>
            </View>

            {/* Choices */}
            <View style={styles.choicesContainer}>
              {/* Option A (Me/Okay) */}
              <TouchableOpacity
                style={[
                  styles.choiceButton,
                  selectedChoice === 'me' && styles.choiceButtonSelected,
                  (showResult && myChoice === 'me' && mode === 'whos-more-likely') && styles.choiceButtonHighlight,
                  (mode === 'is-it-okay' && selectedChoice === 'me') && { borderColor: '#4CC9F0', backgroundColor: 'rgba(76, 201, 240, 0.15)' }
                ]}
                onPress={() => handleSelect('me')}
                disabled={!!selectedChoice}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.choiceText,
                  selectedChoice === 'me' && styles.choiceTextSelected,
                ]}>
                  {optionALabel}
                </Text>

                 {/* Selection Checkmark */}
                {selectedChoice === 'me' && mode !== 'is-it-okay' && (
                  <View style={styles.selectedBadge}>
                    <Check color="white" size={14} />
                  </View>
                )}

                 {/* WML Result Icons */}
                 {getWMLIcon('me') && (
                    <Text style={styles.resultIcon}>{getWMLIcon('me')}</Text>
                 )}

                 {/* Is It Okay Map Pins */}
                 {renderPins('me')}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <Text style={styles.dividerText}>or</Text>
              </View>

              {/* Option B (Partner/Not Okay) */}
              <TouchableOpacity
                style={[
                  styles.choiceButton,
                  selectedChoice === 'partner' && styles.choiceButtonSelected,
                  (showResult && myChoice === 'partner' && mode === 'whos-more-likely') && styles.choiceButtonHighlight,
                   (mode === 'is-it-okay' && selectedChoice === 'partner') && { borderColor: '#F72585', backgroundColor: 'rgba(247, 37, 133, 0.15)' }
                ]}
                onPress={() => handleSelect('partner')}
                disabled={!!selectedChoice}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.choiceText,
                  selectedChoice === 'partner' && styles.choiceTextSelected,
                ]}>
                  {optionBLabel}
                </Text>

                {/* Selection Checkmark */}
                {selectedChoice === 'partner' && mode !== 'is-it-okay' && (
                  <View style={styles.selectedBadge}>
                    <Check color="white" size={14} />
                  </View>
                )}
                
                {/* WML Result Icons */}
                {getWMLIcon('partner') && (
                    <Text style={styles.resultIcon}>{getWMLIcon('partner')}</Text>
                )}

                {/* Is It Okay Map Pins */}
                {renderPins('partner')}
              </TouchableOpacity>
            </View>

            {/* Waiting for partner indicator */}
            {selectedChoice && !showResult && (
              <View style={styles.waitingContainer}>
                <Text style={styles.waitingText}>
                  Waiting for {partnerName} to {mode === 'is-it-okay' ? 'vote' : 'answer'}...
                </Text>
              </View>
            )}

            {/* Results Text */}
            {showResult && mode === 'whos-more-likely' && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsText}>
                  {myChoice === partnerChoice
                    ? '🎉 You both agree!' 
                    : '😄 Different opinions!'}
                </Text>
              </View>
            )}
             {showResult && mode === 'is-it-okay' && (
              <View style={styles.resultsContainer}>
                 {/* Only show text if mismatch, otherwise pins tell the story */}
                 {myChoice !== partnerChoice && (
                    <Text style={styles.resultsText}>Let's discuss!</Text>
                 )}
              </View>
            )}

          </LinearGradient>
        </Animated.View>
      </View>

      {/* Navigation buttons */}
      <View style={styles.navContainer}>
        <TouchableOpacity
          style={[styles.navButton, (!canGoBack || cardNumber <= 1) && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={!canGoBack || cardNumber <= 1}
        >
          <ChevronLeft 
            color={canGoBack && cardNumber > 1 ? colors.text : colors.muted} 
            size={24} 
          />
          <Text style={[
            styles.navButtonText,
            (!canGoBack || cardNumber <= 1) && styles.navButtonTextDisabled
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, isNextDisabled && styles.navButtonDisabled]}
          onPress={handleNext}
          disabled={isNextDisabled}
        >
          <Text style={[styles.navButtonText, isNextDisabled && styles.navButtonTextDisabled]}>Next</Text>
           {isNextDisabled ? (
             <Lock color={colors.muted} size={16} /> 
           ) : (
             <ChevronRight color={colors.text} size={24} />
           )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: colors.muted,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: SCREEN_WIDTH - 48,
    minHeight: SCREEN_HEIGHT * 0.6,
    maxHeight: SCREEN_HEIGHT * 0.75,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 28,
    padding: 28,
    justifyContent: 'space-between',
  },
  questionContainer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  questionLabel: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  promptText: {
    fontFamily: 'Outfit',
    fontSize: 22,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    lineHeight: 30,
  },
  choicesContainer: {
    marginVertical: 24,
    gap: 12,
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  choiceButtonSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  choiceButtonHighlight: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  choiceText: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  choiceTextSelected: {
    color: 'white',
  },
  selectedBadge: {
    position: 'absolute',
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIcon: {
    position: 'absolute',
    left: 16,
    fontSize: 18,
  },
  divider: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dividerText: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'lowercase',
  },
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  waitingText: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
  resultsContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resultsText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
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
  pinsContainer: {
      position: 'absolute',
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
  },
  pin: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'white',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 3,
  },
  pinText: {
      color: 'white',
      fontFamily: 'Outfit',
      fontWeight: 'bold',
      fontSize: 12,
  },
});
