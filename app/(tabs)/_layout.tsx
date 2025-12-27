import { useTheme } from '@/src/context/ThemeContext';
import { darkColors, lightColors } from '@/src/theme/colors';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Activity, Droplets, Gamepad2, Heart, Home } from 'lucide-react-native';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;
  
  // Dark mode navbar colors
  const navbarBg = isDark 
    ? 'rgba(26, 5, 16, 0.92)' // Dark magenta glass
    : 'rgba(255, 255, 255, 0.95)';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 30,
          left: 24,
          right: 24,
          height: 72,
          borderRadius: 36,
          elevation: 10,
          borderTopWidth: 0,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : navbarBg,
          overflow: 'hidden',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          borderWidth: isDark ? 1 : 0,
          borderColor: isDark ? 'rgba(255, 75, 125, 0.2)' : 'transparent',
        },
        tabBarBackground: () => (
          <BlurView 
            intensity={isDark ? 50 : 90} 
            tint={isDark ? 'dark' : 'light'} 
            style={[
              StyleSheet.absoluteFill, 
              styles.blurContainer,
              isDark && { backgroundColor: 'rgba(26, 5, 16, 0.8)' },
            ]} 
          />
        ),
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarItemStyle: {
          paddingVertical: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && [styles.activeIconWrapper, { backgroundColor: `${colors.primary}15` }]]}>
              <Home color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="dew"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && [styles.activeIconWrapper, { backgroundColor: `${colors.primary}15` }]]}>
              <Droplets color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      {/* CENTER: Heart / Nug */}
      <Tabs.Screen
        name="nug"
        options={{
          href: null,
          tabBarIcon: () => (
            <View style={[styles.centerButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
              <Heart color="white" size={28} fill="white" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="games"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && [styles.activeIconWrapper, { backgroundColor: `${colors.primary}15` }]]}>
              <Gamepad2 color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="pulse"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && [styles.activeIconWrapper, { backgroundColor: `${colors.primary}15` }]]}>
              <Activity color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    borderRadius: 36,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  activeIconWrapper: {
    // Dynamic background added inline
  },
  centerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    marginTop: -20,
  },
});
