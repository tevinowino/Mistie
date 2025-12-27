import { colors } from '@/src/theme/colors';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface MistButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
  textStyle?: TextStyle;
}

export const MistButton: React.FC<MistButtonProps> = ({ 
  onPress, 
  title, 
  variant = 'primary', 
  isLoading = false,
  style,
  icon,
  textStyle
}) => {
  const handlePress = () => {
    if (isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getBackgroundColor = () => {
    switch(variant) {
      case 'primary': return colors.coral;
      case 'secondary': return 'rgba(255, 255, 255, 0.3)';
      default: return 'transparent';
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.container, 
        { backgroundColor: getBackgroundColor() },
        variant === 'secondary' && styles.secondaryBorder,
        style
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : colors.text} />
      ) : (
        <>
          {icon}
          <Text style={[
            styles.text, 
            { color: variant === 'primary' ? 'white' : colors.text },
            textStyle
          ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderRadius: 28, // Pill shape
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  text: {
    fontFamily: 'Outfit', // Ensure font is loaded or falls back
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  }
});
