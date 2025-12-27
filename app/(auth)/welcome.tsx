import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { colors } from '@/src/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  return (
    <ScreenWrapper variant="dawn">
      <View style={styles.container}>
        {/* LOGO & BRANDING */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Mistie</Text>
          <Text style={styles.subtitle}>A space for just us two</Text>
        </View>

        {/* FEATURES PREVIEW */}
        <View style={styles.featureSection}>
          <View style={styles.featureItem}>
            <Heart color={colors.primary} size={20} />
            <Text style={styles.featureText}>Connect deeply with your partner</Text>
          </View>
        </View>

        {/* BUTTONS */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/signup')}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 60,
    justifyContent: 'space-between',
  },
  brandSection: {
    alignItems: 'center',
    marginTop: 80,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 24,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: 'Quicksand',
    fontSize: 17,
    color: colors.muted,
    marginTop: 4,
  },
  featureSection: {
    alignItems: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  featureText: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: colors.text,
  },
  buttonSection: {
    gap: 14,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Outfit',
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  secondaryButtonText: {
    fontFamily: 'Outfit',
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
});

