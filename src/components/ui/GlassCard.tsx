import { BlurView } from 'expo-blur'; // Keeping import if we want optional glass
import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'frosted' | 'solid'; // Added variant
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, variant = 'solid', ...props }) => {
  if (variant === 'frosted') {
      return (
        <BlurView intensity={20} tint="light" style={[styles.container, styles.frosted, style]} {...props}>
          {children}
        </BlurView>
      );
  }

  return (
    <View style={[styles.container, styles.solid, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Fallback / Tint
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
  },
  content: {
    padding: 24,
  }
});
