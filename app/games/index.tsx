import { Redirect } from 'expo-router';

/**
 * Index redirects to the main games tab.
 * This file exists to satisfy Expo Router's requirement for an index route
 * when a _layout.tsx references it.
 */
export default function GamesIndex() {
  return <Redirect href="/(tabs)/games" />;
}
