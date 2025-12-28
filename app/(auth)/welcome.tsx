import { useTheme } from '@/src/context/ThemeContext';
import { darkColors, colors as defaultColors, lightColors } from '@/src/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import React from 'react';
import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground 
        source={require('@/src/assets/images/background-image.png')} 
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={isDark 
            ? ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)'] 
            : ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.85)']}
          locations={[0, 0.6]}
          style={styles.overlay}
        >
          <View style={styles.container}>
            {/* LOGO & BRANDING */}
            <View style={styles.brandSection}>
              <Image 
                source={require('@/src/assets/images/full-logo-no-bg.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* FEATURES PREVIEW */}
            <View style={styles.featureSection}>
              <View style={[styles.featureItem, { backgroundColor: isDark ? 'rgba(30,10,20,0.9)' : 'rgba(255,255,255,0.9)' }]}>
                <Heart color={colors.primary} size={20} />
                <Text style={[styles.featureText, { color: colors.text }]}>Connect deeply with your partner</Text>
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
                style={[styles.secondaryButton, { 
                  backgroundColor: isDark ? 'rgba(30,10,20,0.8)' : 'rgba(255,255,255,0.9)',
                  borderColor: isDark ? '#333' : '#FFF'
                }]}
                onPress={() => router.push('/(auth)/signup')}
                activeOpacity={0.9}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
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
  logo: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 56,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: 'Quicksand',
    fontSize: 18,
    marginTop: 4,
    fontWeight: '500',
  },
  featureSection: {
    alignItems: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureText: {
    fontFamily: 'Quicksand',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonSection: {
    gap: 14,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: defaultColors.primary,
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
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '600',
  },
});

