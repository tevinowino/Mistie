import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { darkColors, colors as defaultColors, lightColors } from '@/src/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithPassword } = useAuth();
  
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please fill in both email and password.');
      return;
    }
    setIsLoading(true);
    const { error } = await signInWithPassword(email, password);
    setIsLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message);
    } 
  };

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
            : ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.8)']}
          style={styles.overlay}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* HEADER */}
              <View style={styles.header}>
                <TouchableOpacity 
                  onPress={() => router.back()} 
                  style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white' }]}
                >
                  <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                
                <View style={styles.brandContainer}>
                  <Image 
                    source={require('@/src/assets/images/logo-no-bg.png')} 
                    style={styles.logo}
                    resizeMode="contain"
                  />
                  <View>
                    <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
                    <Text style={[styles.subtitle, { color: colors.muted }]}>Sign in to continue</Text>
                  </View>
                </View>
              </View>

              {/* FORM */}
              <View style={[styles.formCard, { backgroundColor: isDark ? 'rgba(26, 5, 16, 0.95)' : 'rgba(255,255,255,0.95)' }]}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.muted }]}>Email</Text>
                  <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8F8F8' }]}>
                    <Mail color={colors.muted} size={20} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="you@email.com"
                      placeholderTextColor={colors.muted}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.muted }]}>Password</Text>
                  <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8F8F8' }]}>
                    <Lock color={colors.muted} size={20} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Your password"
                      placeholderTextColor={colors.muted}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <EyeOff color={colors.muted} size={20} />
                      ) : (
                        <Eye color={colors.muted} size={20} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    <Text style={styles.submitText}>
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* FOOTER */}
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.muted }]}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/signup')}>
                  <Text style={[styles.footerLink, { color: colors.primary }]}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Quicksand',
    fontSize: 16,
    fontWeight: '500',
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: defaultColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Quicksand',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    gap: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Quicksand',
    fontSize: 15,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitText: {
    fontFamily: 'Outfit',
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  footerText: {
    fontFamily: 'Quicksand',
    fontSize: 14,
  },
  footerLink: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    fontWeight: '600',
  },
});

