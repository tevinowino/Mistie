import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { useAuth } from '@/src/context/AuthContext';
import { bondService } from '@/src/services/bondService';
import { colors } from '@/src/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUpWithPassword } = useAuth();

  const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    const { data, error } = await signUpWithPassword(email, password, name);
    setIsLoading(false);

    if (error) {
      Alert.alert('Signup Failed', error.message);
    } else {
      // Auto-create bond for invitations
      if (data?.user) {
        await bondService.createPendingBond(data.user.id);
      }
      Alert.alert('Account Created', 'Welcome to Mistie.');
    }
  };

  return (
    <ScreenWrapper variant="dawn">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Join Mistie</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        {/* FORM */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name</Text>
            <View style={styles.inputContainer}>
              <User color={colors.muted} size={20} />
              <TextInput
                style={styles.input}
                placeholder="What should we call you?"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Mail color={colors.muted} size={20} />
              <TextInput
                style={styles.input}
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
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Lock color={colors.muted} size={20} />
              <TextInput
                style={styles.input}
                placeholder="Create a password"
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
            onPress={handleSignup}
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
                {isLoading ? 'Creating...' : 'Create Account'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 60,
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Quicksand',
    fontSize: 15,
    color: colors.muted,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontFamily: 'Quicksand',
    fontSize: 13,
    color: colors.muted,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    gap: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Quicksand',
    fontSize: 15,
    color: colors.text,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
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
  },
  footerText: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: colors.muted,
  },
  footerLink: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});

