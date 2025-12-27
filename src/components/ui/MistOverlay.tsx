import { colors } from '@/src/theme/colors';
import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

interface MistOverlayProps {
  isVisible: boolean;
  onReveal: () => void;
  intensity?: number;
}

export const MistOverlay: React.FC<MistOverlayProps> = ({ 
  isVisible, 
  onReveal, 
  intensity = 40 
}) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const isRevealed = useSharedValue(false);

  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 500 });
      isRevealed.value = false;
      translateX.value = 0;
    }
  }, [isVisible]);

  const panGesture = Gesture.Pan()
    .onChange((event) => {
      if (isRevealed.value) return;
      translateX.value = event.translationX;
      
      // Calculate opacity based on drag distance (threshold 200px)
      const dragProgress = Math.abs(event.translationX) / 200;
      opacity.value = Math.max(0, 1 - dragProgress);
    })
    .onEnd(() => {
        if (Math.abs(translateX.value) > 150) {
            // Success Reveal
            isRevealed.value = true;
            opacity.value = withTiming(0, { duration: 300 });
            runOnJS(onReveal)();
        } else {
            // Reset
            translateX.value = withSpring(0);
            opacity.value = withSpring(1);
        }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }]
  }));

  if (!isVisible) return null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.container, animatedStyle]}>
        <AnimatedBlur 
          intensity={intensity} 
          tint="light" 
          style={StyleSheet.absoluteFill} 
        />
        <View style={styles.content}>
            <Animated.Text style={styles.text}>
               Swipe to clear the mist...
            </Animated.Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  text: {
    fontFamily: 'Quicksand',
    color: colors.text,
    fontSize: 16,
    opacity: 0.8,
  }
});
