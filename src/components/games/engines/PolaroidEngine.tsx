import { TutorialOverlay } from '@/src/components/games/tutorials/TutorialOverlay';
import * as Haptics from 'expo-haptics';
import { Camera, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    ZoomIn
} from 'react-native-reanimated';
import { GameEngineProps } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PolaroidEngine: React.FC<GameEngineProps> = ({
  prompts,
  currentIndex,
  onNext,
  hasSeenTutorial,
  markTutorialSeen,
}) => {
  const [showTutorial, setShowTutorial] = useState(!hasSeenTutorial);
  const currentPrompt = prompts[currentIndex];

  // Development State
  const blurAmount = useSharedValue(10);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [hasSeenTutorial]);

  // Reset animation on new card
  useEffect(() => {
    if (currentPrompt) {
        blurAmount.value = 10;
        opacity.value = 0;
        
        // "Develop" animation
        blurAmount.value = withTiming(0, { duration: 2500 });
        opacity.value = withTiming(1, { duration: 1500 });
    }
  }, [currentPrompt, currentIndex]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNext();
  };

  const imageStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    // Note: React Native implementation of blur is tricky without specific libraries (like expo-blur).
    // We can simulate 'development' with opacity and color shifting, or just opacity for now.
    // If using Expo Image, we could animate blurRadius.
    // For text, we can just animate opacity.
  }));

  if (!currentPrompt) return <View />;

  return (
    <View style={styles.container}>
      {/* Polaroid Frame */}
      <Animated.View entering={ZoomIn.duration(500)} style={styles.polaroidFrame}>
        {/* Photo Area (Dark placeholder that "develops") */}
        <View style={styles.photoArea}>
            <Animated.View style={[styles.photoContent, imageStyle]}>
                <View style={styles.textContainer}>
                    <Text style={styles.promptText}>{currentPrompt.prompt_text}</Text>
                </View>
            </Animated.View>
            
            {/* Developing Overlay (fades out) */}
            <Animated.View 
                style={[
                    StyleSheet.absoluteFillObject, 
                    styles.developingOverlay,
                    useAnimatedStyle(() => ({ opacity: 1 - opacity.value }))
                ]} 
            />
        </View>

        {/* Caption Area */}
        <View style={styles.captionArea}>
            <Text style={styles.captionText}>Memory #{currentIndex + 1}</Text>
            <TouchableOpacity onPress={handleNext}>
                <RefreshCw color="#333" size={20} />
            </TouchableOpacity>
        </View>
      </Animated.View>

      <Text style={styles.hintText}>Wait for the memory to develop...</Text>

      {/* Tutorial */}
      {showTutorial && (
        <TutorialOverlay
          gameSlug="polaroid"
          onDismiss={() => {
            setShowTutorial(false);
            markTutorialSeen();
          }}
          content={{
            title: "Memory Lane",
            description: "Watch the memory develop. Share the story behind it.",
            icon: <Camera color="white" size={40} />,
            gradientColors: ['#FF9966', '#FF5E62']
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
    padding: 20,
    backgroundColor: '#e0e0e0', // Light background for contrast
  },
  polaroidFrame: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    transform: [{ rotate: '-2deg' }],
  },
  photoArea: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#202020',
    marginBottom: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoContent: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 20,
  },
  textContainer: {
     alignItems: 'center',
     justifyContent: 'center',
  },
  promptText: {
    fontFamily: 'Outfit', // Or a handwriting font if available
    fontSize: 24,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  developingOverlay: {
    backgroundColor: '#1a1a1a',
  },
  captionArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  captionText: {
    fontFamily: 'Quicksand',
    fontSize: 18,
    color: '#444',
    fontStyle: 'italic', // Handwriting feel
  },
  hintText: {
    marginTop: 40,
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: '#666',
  },
});
