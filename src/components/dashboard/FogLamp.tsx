import { colors } from '@/src/theme/colors';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

interface FogLampProps {
  isActive?: boolean;
  hasNug?: boolean;
}

export const FogLamp: React.FC<FogLampProps> = ({ isActive = false, hasNug = false }) => {
  const glowOpacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (hasNug) {
      // Intense pulse for incoming Nug
      glowOpacity.value = withRepeat(
        withSequence(withTiming(0.8, { duration: 500 }), withTiming(0.2, { duration: 500 })),
        -1,
        true
      );
      scale.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 500 }), withTiming(1.0, { duration: 500 })),
        -1,
        true
      );
    } else if (isActive) {
      // Gentle pulse for presence
      glowOpacity.value = withRepeat(
        withSequence(
            withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) }), 
            withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      scale.value = withTiming(1);
    } else {
      // Static
      glowOpacity.value = withTiming(0);
      scale.value = withTiming(1);
    }
  }, [isActive, hasNug]);

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, animatedGlow, { 
          backgroundColor: hasNug ? colors.primary : colors.secondary 
      }]} />
      <Text style={[styles.logo, { 
          color: isActive || hasNug ? colors.primary : colors.muted,
          opacity: isActive ? 1 : 0.5
      }]}>M</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  logo: {
    fontFamily: 'Outfit',
    fontSize: 32,
    fontWeight: 'bold',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    backgroundColor: colors.secondary,
    zIndex: -1,
  }
});
