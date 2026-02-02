import { CustomTabBar } from '@/src/components/navigation/CustomTabBar';
import { useTheme } from '@/src/context/ThemeContext';
import { Tabs } from 'expo-router';
import { Activity, Droplets, Gamepad2, Home } from 'lucide-react-native';

export default function TabLayout() {
  const { isDark } = useTheme();

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
