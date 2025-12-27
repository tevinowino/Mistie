import { useTheme } from '@/src/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenWrapperProps {
  children: React.ReactNode;
  variant?: 'dawn' | 'dusk'; // dawn = light, dusk = dark (legacy)
  noPadding?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ 
  children, 
  variant = 'dawn',
  noPadding = false,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  // Use theme-based gradients
  const gradients = {
    light: ['#FFF0F5', '#FFF5F7', '#FFFFFF'],
    dark: ['#000000', '#1A0510', '#52001F'], // Black to dark magenta
  };

  // Choose gradient based on theme (override variant with theme)
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
      <View 
        style={[
          styles.content, 
          { paddingTop: insets.top, paddingBottom: insets.bottom },
          noPadding && { paddingHorizontal: 0 },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  }
});
