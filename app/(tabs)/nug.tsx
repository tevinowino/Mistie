import { Redirect } from 'expo-router';

// This is a dummy route for the "Nug" center button in the tab bar.
// It should never be navigated to directly.
export default function NugScreen() {
  return <Redirect href="/(tabs)" />;
}
