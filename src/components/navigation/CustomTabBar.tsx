import { useTheme } from '@/src/context/ThemeContext';
import { darkColors, lightColors } from '@/src/theme/colors';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  
  // Base background for the entire bar
  const barBg = isDark 
    ? 'rgba(26, 5, 16, 0.92)' 
    : 'rgba(255, 255, 255, 0.95)';

  const borderColor = isDark ? 'rgba(255, 75, 125, 0.2)' : 'transparent';

  return (
    <View style={[
      styles.container, 
      { 
        bottom: Platform.OS === 'ios' ? insets.bottom : 24,
        backgroundColor: barBg,
        borderColor: borderColor,
        borderWidth: isDark ? 1 : 0,
        paddingHorizontal: 4, // Reduced to maximize space
      }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const optionsAny = options as any;
        // Skip if href is null (hidden tabs)
        if (optionsAny.href === null) return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            // HAPTIC FEEDBACK HERE
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Render the icon
        const Icon = options.tabBarIcon;
        
        return (
            <TabItem
                key={route.key}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                label={label as string}
                icon={Icon}
                activeColor={colors.primary}
                inactiveColor={colors.muted}
                isDark={isDark}
            />
        );
      })}
    </View>
  );
}

// Sub-component for individual tab items to handle their own animation state
const TabItem = ({ 
    isFocused, 
    onPress, 
    onLongPress, 
    label, 
    icon, 
    activeColor, 
    inactiveColor,
    isDark
}: any) => {

    // Animate flex to give active tab more space
    const animatedFlexStyle = useAnimatedStyle(() => {
        return {
            flex: withSpring(isFocused ? 2.5 : 1, { damping: 20, stiffness: 200 })
        };
    });

    // Animate background and padding
    const animatedInnerStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: isFocused 
                ? withTiming(isDark ? 'rgba(255, 107, 148, 0.15)' : 'rgba(255, 75, 125, 0.1)') 
                : 'transparent',
            paddingHorizontal: isFocused ? withSpring(16) : withSpring(0),
        };
    });

    return (
        <Animated.View style={[styles.tabWrapper, animatedFlexStyle]}>
            <TouchableOpacity
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabButton}
                activeOpacity={0.7}
            >
                <Animated.View style={[styles.innerItem, animatedInnerStyle]}>
                    {icon && icon({ 
                        color: isFocused ? activeColor : inactiveColor, 
                        focused: isFocused, 
                        size: 20 
                    })}
                    
                    {isFocused && (
                        <Animated.Text 
                            entering={FadeIn.duration(200)}
                            style={[styles.label, { color: activeColor }]}
                            numberOfLines={1}
                        >
                            {label}
                        </Animated.Text>
                    )}
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    left: 16,
    right: 16,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12, // Default padding, overridden inline
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  tabWrapper: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    height: 48,
    gap: 8,
    overflow: 'hidden',
  },
  label: {
    fontFamily: 'Outfit',
    fontSize: 14,
    fontWeight: '600',
    // marginLeft: 4, // Removed as gap handles this
  }
});
