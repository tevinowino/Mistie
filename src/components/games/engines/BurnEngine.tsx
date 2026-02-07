import { TutorialOverlay } from '@/src/components/games/tutorials/TutorialOverlay';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated';
import { GameEngineProps } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const BurnEngine: React.FC<GameEngineProps> = ({
  prompts,
  currentIndex,
  onNext,
  hasSeenTutorial,
  markTutorialSeen,
}) => {
  const [showTutorial, setShowTutorial] = useState(!hasSeenTutorial);
  const currentPrompt = prompts[currentIndex];
  
  // Pulse Animation
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [hasSeenTutorial]);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onNext();
  };

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.8,
  }));

  if (!currentPrompt) return <View />;

  return (
    <View style={styles.container}>
      {/* Pulsing Background */}
      <View style={StyleSheet.absoluteFillObject}>
         <LinearGradient
            colors={['#000000', '#4A0000']}
            style={StyleSheet.absoluteFillObject}
         />
         <Animated.View style={[StyleSheet.absoluteFillObject, animatedBackgroundStyle]}>
            <LinearGradient
                colors={['transparent', '#FF0000', 'transparent']} // Radial-ish effect
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />
         </Animated.View>
      </View>

      {/* Card Content */}
      <View style={styles.cardContainer}>
          <Animated.View entering={ZoomIn} key={currentPrompt.id} style={styles.textWrapper}>
             <Flame color="#FF4500" size={48} style={{ marginBottom: 24 }} />
             <Text style={styles.promptText}>{currentPrompt.prompt_text}</Text>
          </Animated.View>
      </View>

      {/* Controls */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
         <RefreshCw color="rgba(255,255,255,0.7)" size={32} />
      </TouchableOpacity>

      {/* Tutorial */}
      {showTutorial && (
        <TutorialOverlay
          gameSlug="burn"
          onDismiss={() => {
            setShowTutorial(false);
            markTutorialSeen();
          }}
          content={{
            title: "Intimacy",
            description: "Turn up the heat. Be honest, be bold.",
            icon: <Flame color="white" size={40} />,
            gradientColors: ['#800000', '#FF0000'] 
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
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  textWrapper: {
     alignItems: 'center',
     gap: 16,
  },
  promptText: {
    fontFamily: 'Outfit',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700', // Gold/Orange
    textAlign: 'center',
    textShadowColor: 'rgba(255, 69, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    lineHeight: 44,
  },
  nextButton: {
    position: 'absolute',
    bottom: 60,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
