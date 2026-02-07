import { TutorialOverlay } from '@/src/components/games/tutorials/TutorialOverlay';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Gauge } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    FadeIn,
    SlideInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { GameEngineProps } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SpectrumBar = ({ myChoice, partnerChoice, isDone }: { myChoice: string | null, partnerChoice: string | null, isDone: boolean }) => {
  // 'me' = Totally Fine (100%), 'partner' = No Way (0%) ?
  // Wait, let's standardize choices.
  // Let's assume choice 'A' = NO WAY (0%), choice 'B' = TOTALLY FINE (100%)
  // or use the strings 'no-way' and 'totally-fine' if we can control submitAnswer.
  // For 'Is It Okay', usually 'me' choice maps to "I think it's okay" vs "I don't"?
  // Let's map choices locally in the component.

  // Helper to map choice to position (0 to 1)
  const getPosition = (choice: string) => {
    if (!choice) return 0.5;
    return choice === 'totally-fine' ? 1 : 0;
  };

  const myPos = useSharedValue(0.5);
  const partnerPos = useSharedValue(0.5);

  useEffect(() => {
    if (myChoice) myPos.value = withSpring(getPosition(myChoice));
    if (partnerChoice && isDone) partnerPos.value = withSpring(getPosition(partnerChoice));
  }, [myChoice, partnerChoice, isDone]);

  const myStyle = useAnimatedStyle(() => ({
    left: `${myPos.value * 100}%`,
    transform: [{ translateX: -16 }], // Center the avatar bubble
  }));

  const partnerStyle = useAnimatedStyle(() => ({
    left: `${partnerPos.value * 100}%`,
    transform: [{ translateX: -16 }],
  }));

  return (
    <View style={styles.spectrumContainer}>
      {/* Bar */}
      <View style={styles.bar}>
        <LinearGradient
          colors={['#FF5252', '#FFEB3B', '#4CAF50']} // Red -> Yellow -> Green
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradientBar}
        />
      </View>

      {/* Labels */}
      <View style={styles.labelsRow}>
        <Text style={styles.barLabel}>NO WAY</Text>
        <Text style={styles.barLabel}>TOTALLY FINE</Text>
      </View>

      {/* Avatars */}
      {myChoice && (
        <Animated.View style={[styles.avatarMarker, myStyle, { zIndex: 2 }]}>
          <Text style={styles.avatarText}>Me</Text>
        </Animated.View>
      )}

      {isDone && partnerChoice && (
        <Animated.View style={[styles.avatarMarker, partnerStyle, { zIndex: 1, backgroundColor: '#333' }]}>
           <Text style={styles.avatarText}>Them</Text>
        </Animated.View>
      )}
    </View>
  );
};

export const SpectrumEngine: React.FC<GameEngineProps> = ({
  prompts,
  currentIndex,
  submitAnswer,
  myAnswer,
  partnerAnswer,
  onNext,
  hasSeenTutorial,
  markTutorialSeen,
}) => {
  const [showTutorial, setShowTutorial] = useState(!hasSeenTutorial);
  const currentPrompt = prompts[currentIndex];

  useEffect(() => {
    if (!hasSeenTutorial) setShowTutorial(true);
  }, [hasSeenTutorial]);

  const handleSelect = (choice: 'no-way' | 'totally-fine') => {
    if (myAnswer) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    submitAnswer(choice);
  };

  const isDone = !!(myAnswer && partnerAnswer);

  if (!currentPrompt) return <View />;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Question */}
        <Animated.View entering={FadeIn} style={styles.promptContainer}>
           <Text style={styles.promptText}>{currentPrompt.prompt_text}</Text>
        </Animated.View>

        {/* Visualizer */}
        <SpectrumBar myChoice={myAnswer} partnerChoice={partnerAnswer} isDone={isDone} />
      </View>

      {/* Controls */}
      {!isDone && (
        <Animated.View entering={SlideInDown.delay(200)} style={styles.controls}>
          <TouchableOpacity 
            style={[styles.button, styles.noButton, myAnswer === 'no-way' && styles.selectedNo]}
            onPress={() => handleSelect('no-way')}
            disabled={!!myAnswer}
          >
            <Text style={styles.buttonText}>NO WAY</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.yesButton, myAnswer === 'totally-fine' && styles.selectedYes]}
            onPress={() => handleSelect('totally-fine')}
            disabled={!!myAnswer}
          >
            <Text style={styles.buttonText}>TOTALLY FINE</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Next Button (Only when done) */}
      {isDone && (
         <Animated.View entering={SlideInDown} style={styles.nextContainer}>
            <TouchableOpacity style={styles.nextButton} onPress={onNext}>
               <Text style={styles.nextButtonText}>Next Question</Text>
               <ChevronRight color="white" size={24} />
            </TouchableOpacity>
         </Animated.View>
      )}

      {/* Tutorial */}
      {showTutorial && (
        <TutorialOverlay
          gameSlug="spectrum"
          onDismiss={() => {
            setShowTutorial(false);
            markTutorialSeen();
          }}
          content={{
            title: "Spectrum",
            description: "How acceptable is this? Choose your stance and see where you align.",
            icon: <Gauge color="white" size={40} />,
            gradientColors: ['#FF5252', '#4CAF50']
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 60,
  },
  promptContainer: {
    paddingHorizontal: 10,
  },
  promptText: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    lineHeight: 38,
  },
  spectrumContainer: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
  },
  bar: {
    height: 12,
    borderRadius: 6,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  gradientBar: {
    flex: 1,
    width: '100%',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  barLabel: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  avatarMarker: {
    position: 'absolute',
    top: -20, // Float above bar
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    fontFamily: 'Outfit',
    fontSize: 10,
    fontWeight: 'bold',
    color: 'black',
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  noButton: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)', // Red tint
    borderColor: '#FF5252',
  },
  yesButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)', // Green tint
    borderColor: '#4CAF50',
  },
  selectedNo: {
    backgroundColor: '#FF5252',
  },
  selectedYes: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  nextContainer: {
     alignItems: 'center',
     marginBottom: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
  },
  nextButtonText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
