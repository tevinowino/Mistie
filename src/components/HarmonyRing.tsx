import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

interface HarmonyRingProps {
  score: number;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  showLabel?: boolean;
  transparent?: boolean;
}

export function HarmonyRing({ 
  score, 
  size = 'medium', 
  showLabel = true, 
  transparent = false 
}: HarmonyRingProps) {
  const waveAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bubbleAnim1 = useRef(new Animated.Value(0)).current;
  const bubbleAnim2 = useRef(new Animated.Value(0)).current;
  const bubbleAnim3 = useRef(new Animated.Value(0)).current;
  const glareAnim = useRef(new Animated.Value(0)).current;

  const sizes = {
    tiny: { outer: 52, fontSize: 16, labelSize: 7 },
    small: { outer: 72, fontSize: 20, labelSize: 8 },
    medium: { outer: 100, fontSize: 28, labelSize: 10 },
    large: { outer: 140, fontSize: 36, labelSize: 11 },
  };

  const config = sizes[size];

  useEffect(() => {
    // Continuous wave motion
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();

    // Gentle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Bubble animations with delays
    const createBubbleAnimation = (animValue: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 4000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    createBubbleAnimation(bubbleAnim1, 0);
    createBubbleAnimation(bubbleAnim2, 1300);
    createBubbleAnimation(bubbleAnim3, 2600);

    // Glare animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glareAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glareAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const getLabel = () => {
    if (score >= 80) return 'THRIVING';
    if (score >= 60) return 'GROWING';
    if (score >= 40) return 'BUDDING';
    return 'NEW';
  };

  const getLiquidColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FFC107';
    if (score >= 20) return '#FF9800';
    return '#F44336';
  };

  const liquidColor = getLiquidColor(score);
  const liquidHeight = (score / 100) * config.outer * 0.7;

  // Wave animation
  const wave1 = waveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -4, 0],
  });

  const wave2 = waveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 4, 0],
  });

  // Bubble animations
  const createBubbleStyle = (animValue: Animated.Value, xPos: number) => ({
    position: 'absolute' as const,
    width: config.outer * 0.08,
    height: config.outer * 0.08,
    borderRadius: config.outer * 0.04,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    left: xPos,
    bottom: 0, // Start at bottom
    opacity: animValue.interpolate({
      inputRange: [0, 0.2, 0.8, 1],
      outputRange: [0, 1, 1, 0],
    }),
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -config.outer * 0.6], // Move up by using negative Y
        }),
      },
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1.2],
        }),
      }
    ],
  });

  const glareOpacity = glareAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ scale: pulseAnim }] }
      ]}
    >
      {/* Glass bottle outer shell */}
      <View
        style={[
          styles.bottleOuter,
          {
            width: config.outer,
            height: config.outer,
            borderRadius: config.outer / 2,
          },
        ]}
      >
        {/* Inner glass effect */}
        <View
          style={[
            styles.bottleInner,
            {
              width: config.outer - 8,
              height: config.outer - 8,
              borderRadius: (config.outer - 8) / 2,
            },
          ]}
        >
          {/* Liquid container */}
          <View style={styles.liquidContainer}>
            {/* Liquid fill */}
            <Animated.View
              style={[
                styles.liquid,
                {
                  height: liquidHeight,
                  backgroundColor: liquidColor,
                  borderBottomLeftRadius: (config.outer - 16) / 2,
                  borderBottomRightRadius: (config.outer - 16) / 2,
                },
              ]}
            >
              {/* Bubbles */}
              <Animated.View style={createBubbleStyle(bubbleAnim1, config.outer * 0.3)} />
              <Animated.View style={createBubbleStyle(bubbleAnim2, config.outer * 0.5)} />
              <Animated.View style={createBubbleStyle(bubbleAnim3, config.outer * 0.6)} />

              {/* Liquid shine */}
              <View
                style={[
                  styles.liquidShine,
                  {
                    width: config.outer * 0.3,
                    height: config.outer * 0.3,
                  },
                ]}
              />
            </Animated.View>

            {/* Wave effects */}
            <Animated.View
              style={[
                styles.wave,
                {
                  bottom: liquidHeight - 2,
                  backgroundColor: liquidColor,
                  transform: [{ translateY: wave1 }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.wave,
                {
                  bottom: liquidHeight - 2,
                  backgroundColor: liquidColor,
                  opacity: 0.6,
                  transform: [{ translateY: wave2 }],
                },
              ]}
            />
          </View>

          {/* Score text */}
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.score,
                {
                  fontSize: config.fontSize,
                  color: score < 40 ? '#333' : '#fff',
                  textShadowColor: 'rgba(0, 0, 0, 0.3)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                },
              ]}
            >
              {score}
            </Text>
          </View>
        </View>

        {/* Glass glare effect */}
        <Animated.View
          style={[
            styles.glare,
            {
              width: config.outer * 0.4,
              height: config.outer * 0.8,
              borderRadius: config.outer * 0.2,
              opacity: glareOpacity,
            },
          ]}
        />

        {/* Glass reflection */}
        <View
          style={[
            styles.reflection,
            {
              width: config.outer * 0.25,
              height: config.outer * 0.5,
              borderRadius: config.outer * 0.125,
            },
          ]}
        />
      </View>

      {/* Label */}
      {showLabel && size !== 'tiny' && (
        <Text
          style={[
            styles.label,
            {
              fontSize: config.labelSize,
              marginTop: 8,
            },
          ]}
        >
          {getLabel()}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottleOuter: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  bottleInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liquidContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
  liquid: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  liquidShine: {
    position: 'absolute',
    top: '10%',
    left: '15%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 100,
    opacity: 0.6,
  },
  wave: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  textContainer: {
    zIndex: 10,
    alignItems: 'center',
  },
  score: {
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#666',
    fontFamily: 'System',
    textTransform: 'uppercase',
  },
  glare: {
    position: 'absolute',
    top: '10%',
    left: '15%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  reflection: {
    position: 'absolute',
    top: '15%',
    right: '15%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});