import { useTheme } from '@/src/context/ThemeContext';
import { useIsFocused } from '@react-navigation/native'; // Or expo-router
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenWrapperProps {
  children: React.ReactNode;
  variant?: 'dawn' | 'dusk';
  noPadding?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ 
  children, 
  variant = 'dawn',
  noPadding = false,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const isFocused = useIsFocused(); // Check if screen is active

  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10); // Slight slide up

  useEffect(() => {
    if (isFocused) {
      // Reset and animate in
      opacity.value = 0;
      translateY.value = 10;
      
      opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    }
    // Optional: Animate out on blur? usually confusing for tabs
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
    flex: 1, // Ensure it fills space
  }));

  // Use theme-based gradients
  const gradients = {
    light: ['#FFF0F5', '#FFF5F7', '#FFFFFF'],
    dark: ['#000000', '#1A0510', '#52001F'], 
  };

  const activeGradient = isDark ? gradients.dark : gradients.light;
  const statusBarStyle = isDark ? 'light-content' : 'dark-content';

  return (
    <View style={styles.container}>
      <StatusBar barStyle={statusBarStyle} />
      <LinearGradient
        colors={activeGradient as any}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Animated.View 
        style={[
          styles.content, 
          animatedStyle,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
          noPadding && { paddingHorizontal: 0 },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24, // Default padding, removed if noPadding is true
  }
});
