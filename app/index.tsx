import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';

export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.teal }}>
        <ActivityIndicator size="large" color={colors.coral} />
      </View>
    );
  }

  // Redirect based on auth state
  if (session) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/(auth)/welcome" />;
  }
}