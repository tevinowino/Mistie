import { colors } from '@/src/theme/colors';
import { Heart, Sparkles } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

interface NugSentOverlayProps {
  visible: boolean;
  onAnimationComplete: () => void;
}

const { width, height } = Dimensions.get('window');

// Random sparkle positions
const SPARKLES = Array.from({ length: 12 }).map((_, i) => ({
  id: i,
  x: (Math.random() - 0.5) * 200,
  y: (Math.random() - 0.5) * 200,
  scale: Math.random() * 0.5 + 0.5,
  delay: Math.random() * 300,
}));

export function NugSentOverlay({ visible, onAnimationComplete }: NugSentOverlayProps) {
  const mainScale = useRef(new Animated.Value(0)).current;
  const mainOpacity = useRef(new Animated.Value(0)).current;
  const mainY = useRef(new Animated.Value(0)).current;
  
  // Array of animated values for sparkles
  const sparkleAnims = useRef(SPARKLES.map(() => ({
    scale: new Animated.Value(0),
    opacity: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    if (visible) {
      // Reset values
      mainScale.setValue(0);
      mainOpacity.setValue(0);
      mainY.setValue(0);
      sparkleAnims.forEach(anim => {
        anim.scale.setValue(0);
        anim.opacity.setValue(0);
      });

      // 1. Main Icon Pop + Fly Up
      const mainAnimation = Animated.parallel([
        Animated.spring(mainScale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(mainOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(mainY, {
            toValue: -150,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(mainOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ]);

      // 2. Sparkles Burst
      const sparkleAnimations = sparkleAnims.map((anim, i) => {
        return Animated.sequence([
          Animated.delay(SPARKLES[i].delay),
          Animated.parallel([
            Animated.spring(anim.scale, {
              toValue: SPARKLES[i].scale,
              friction: 6,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            })
          ]),
          Animated.delay(300),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          })
        ]);
      });

      // Run everything
      Animated.parallel([
        mainAnimation,
        ...sparkleAnimations,
      ]).start(() => {
        onAnimationComplete();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.centerParams}>
        {/* Sparkles */}
        {SPARKLES.map((sparkle, i) => (
          <Animated.View
            key={sparkle.id}
            style={[
              styles.sparkle,
              {
                transform: [
                  { translateX: sparkle.x },
                  { translateY: sparkle.y },
                  { scale: sparkleAnims[i].scale }
                ],
                opacity: sparkleAnims[i].opacity,
              }
            ]}
          >
            <Sparkles color="#FFD700" size={24} fill="#FFD700" />
          </Animated.View>
        ))}

        {/* Main Heart */}
        <Animated.View
          style={[
            styles.mainIcon,
            {
              transform: [
                { scale: mainScale },
                { translateY: mainY }
              ],
              opacity: mainOpacity,
            }
          ]}
        >
          <Heart color={colors.primary} size={80} fill={colors.primary} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerParams: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainIcon: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  sparkle: {
    position: 'absolute',
  }
});
