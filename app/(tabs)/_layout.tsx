import { CustomTabBar } from '@/src/components/navigation/CustomTabBar';
import { useTheme } from '@/src/context/ThemeContext';
import { darkColors, lightColors } from '@/src/theme/colors';
import { Tabs } from 'expo-router';
import { Activity, Droplets, Gamepad2, Heart, Home } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;
  
  // Dark mode navbar colors
  const navbarBg = isDark 
    ? 'rgba(26, 5, 16, 0.92)' // Dark magenta glass
    : 'rgba(255, 255, 255, 0.95)';

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} size={24} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="dew"
        options={{
          title: 'Dew',
          tabBarIcon: ({ color, focused }) => (
            <Droplets color={color} size={24} strokeWidth={1.5} />
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
          title: 'Games',
          tabBarIcon: ({ color, focused }) => (
            <Gamepad2 color={color} size={24} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="pulse"
        options={{
          title: 'Pulse',
          tabBarIcon: ({ color, focused }) => (
            <Activity color={color} size={24} strokeWidth={1.5} />
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
