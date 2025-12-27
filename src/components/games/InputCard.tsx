import { colors } from '@/src/theme/colors';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Keyboard,
    PanResponder,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_HEIGHT * 0.15;
const MAX_LENGTH = 150;

interface InputCardProps {
  prompt: string;
  cardNumber: number;
  totalCards: number;
  gradientColors: string[];
  onNext: () => void;
  onPrevious: () => void;
  onClose?: () => void;
  onSubmit: (text: string) => void;
  canGoBack?: boolean;
  myName?: string;
  partnerName?: string;
  myAnswer?: string | null;
  partnerAnswer?: string | null;
}

export function InputCard({
  prompt,
  cardNumber,
  totalCards,
  gradientColors,
  onNext,
  onPrevious,
  onClose,
  onSubmit,
  canGoBack = true,
  myName = 'Me',
  partnerName = 'Partner',
  myAnswer = null,
  partnerAnswer = null,
}: InputCardProps) {
  const cardScale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const cardTranslateY = useRef(new Animated.Value(0)).current; // For keyboard slide up
  
  const [inputText, setInputText] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState(prompt);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Reset when prompt changes
  useEffect(() => {
    if (prompt !== currentPrompt) {
      setCurrentPrompt(prompt);
      setInputText('');
      pan.setValue({ x: 0, y: 0 });
    }
  }, [prompt]);

  // Handle keyboard events to slide card up
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      'keyboardWillShow',
      (e) => {
        setKeyboardVisible(true);
        Animated.timing(cardTranslateY, {
          toValue: -100, // Move up
          duration: e.duration,
          useNativeDriver: true,
        }).start();
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      'keyboardWillHide',
      (e) => {
        setKeyboardVisible(false);
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: e.duration,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Keyboard.dismiss();
    onSubmit(inputText.trim());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isKeyboardVisible, // Disable swipe when typing
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only take over if moving vertically significantly and not keyboard
        return Math.abs(gesture.dy) > 10 && !isKeyboardVisible;
      },
      onPanResponderGrant: () => {
        Animated.spring(cardScale, {
          toValue: 0.97,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          Animated.event([
            null,
            { dy: pan.y }
          ], { useNativeDriver: false })(_, gesture);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        Animated.spring(cardScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        if (gesture.dy > SWIPE_THRESHOLD) {
          // Close
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

  const showResult = !!(myAnswer && partnerAnswer);
  const waitingForPartner = !!(myAnswer && !partnerAnswer);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                  { translateY: Animated.add(pan.y, cardTranslateY) },
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
                <Text style={styles.gameTypeLabel}>Mirror</Text>
                <Text style={styles.promptText}>{currentPrompt}</Text>
              </View>

              {/* Content Area */}
              <View style={styles.contentContainer}>
                {!myAnswer ? (
                  /* Input State */
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Type your answer..."
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      multiline
                      maxLength={MAX_LENGTH}
                      value={inputText}
                      onChangeText={setInputText}
                      returnKeyType="done"
                    />
                    <View style={styles.inputFooter}>
                      <Text style={styles.charCount}>
                        {inputText.length}/{MAX_LENGTH}
                      </Text>
                      <TouchableOpacity 
                        style={[
                          styles.submitButton,
                          !inputText.trim() && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={!inputText.trim()}
                      >
                        <Text style={styles.submitButtonText}>Submit</Text>
                        <Send size={16} color={!inputText.trim() ? "rgba(255,255,255,0.5)" : "white"} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : waitingForPartner ? (
                  /* Waiting State */
                  <View style={styles.waitingContainer}>
                    <View style={styles.myAnswerPreview}>
                      <Text style={styles.previewLabel}>Your Answer:</Text>
                      <Text style={styles.previewText}>{myAnswer}</Text>
                    </View>
                    <View style={styles.waitingIndicator}>
                      <Text style={styles.waitingText}>
                        Waiting for {partnerName} to answer...
                      </Text>
                    </View>
                  </View>
                ) : (
                  /* Results State */
                  <View style={styles.resultsContainer}>
                    <View style={styles.resultBox}>
                      <Text style={styles.resultLabel}>{myName}</Text>
                      <Text style={styles.resultText}>{myAnswer}</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.resultBox}>
                      <Text style={styles.resultLabel}>{partnerName}</Text>
                      <Text style={styles.resultText}>{partnerAnswer}</Text>
                    </View>
                    
                    {/* Next Button for explicit 'Done' feeling? */}
                    <TouchableOpacity 
                        style={styles.nextButton}
                        onPress={onNext}
                    >
                        <Text style={styles.nextButtonText}>Next Card</Text>
                        <ChevronRight size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

            </LinearGradient>
          </Animated.View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: 'Outfit',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 20,
  },
  cardContainer: {
    width: '100%',
    minHeight: SCREEN_HEIGHT * 0.6,
    maxHeight: SCREEN_HEIGHT * 0.75,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 32,
    padding: 24,
  },
  questionContainer: {
    marginBottom: 24,
  },
  gameTypeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'Quicksand',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  promptText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Outfit',
    fontWeight: '600',
    lineHeight: 38,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inputWrapper: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Outfit',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  charCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: 'Outfit',
  },
  submitButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit',
    fontWeight: '600',
  },
  waitingContainer: {
    alignItems: 'center',
    gap: 24,
  },
  myAnswerPreview: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 16,
    borderRadius: 16,
  },
  previewLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'Outfit',
  },
  previewText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontFamily: 'Outfit',
  },
  waitingIndicator: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
  },
  waitingText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontFamily: 'Outfit',
  },
  resultsContainer: {
    flex: 1,
    gap: 16,
  },
  resultBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    borderRadius: 16,
    flex: 1,
  },
  resultLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'Quicksand',
    textTransform: 'uppercase',
  },
  resultText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
    gap: 4,
  },
  nextButtonText: {
    color: colors.primary, // Using primary color for text since button is white
    fontSize: 16,
    fontFamily: 'Outfit',
    fontWeight: '600',
  },
});
