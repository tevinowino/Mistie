import { colors } from '@/src/theme/colors';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface DigitalGardenProps {
  streak: number;
  onSendNug: () => void;
}

export const DigitalGarden: React.FC<DigitalGardenProps> = ({ streak, onSendNug }) => {
  const pressed = useSharedValue(false);

  // Mist Logic: Opacity decreases as streak increases.
  // 0 streak = 0.9 opacity (Thick)
  // 30 streak = 0.0 opacity (Clear)
  const mistOpacity = Math.max(0, 0.9 - (streak / 30));

  const longPress = Gesture.LongPress()
    .onBegin(() => {
      pressed.value = true;
    })
    .onFinalize(() => {
      pressed.value = false;
    })
    .onStart(() => {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
        runOnJS(onSendNug)();
    })
    .minDuration(800);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.95 : 1) }],
    opacity: withSpring(pressed.value ? 0.8 : 1),
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
        <GestureDetector gesture={longPress}>
            <Animated.View style={[styles.gardenContainer, animatedStyle]}>
                
                {/* GARDEN ART (Placeholder for now) */}
                <View style={styles.gardenArt}>
                    {/* Placeholder Flowers */}
                    <Text style={{ fontSize: 40, top: 40, left: 20, position: 'absolute' }}>🌸</Text>
                    <Text style={{ fontSize: 50, top: 80, right: 40, position: 'absolute' }}>🌺</Text>
                    {streak > 7 && <Text style={{ fontSize: 60, bottom: 40, alignSelf:'center', position: 'absolute' }}>🌻</Text>}
                    
                    {/* CENTER LABEL */}
                    <Text style={styles.gardenLabel}>
                        {pressed.value ? "Sending Love..." : "Hold to Connect"}
                    </Text>
                </View>

                {/* MIST LAYER */}
                <View style={[styles.mistLayer, { backgroundColor: `rgba(255, 255, 255, ${mistOpacity})` }]} pointerEvents="none" />
                
            </Animated.View>
        </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  gardenContainer: {
    width: '100%',
    height: '100%',
    maxHeight: 400,
    borderRadius: 40,
    backgroundColor: '#FFF5F7', // Very light pink bg for garden
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gardenArt: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gardenLabel: {
    fontFamily: 'Quicksand',
    color: colors.muted,
    marginTop: 100,
    opacity: 0.6,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  mistLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
  }
});
