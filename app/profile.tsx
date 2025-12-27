import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { supabase } from '@/src/lib/supabase';
import { darkColors, lightColors } from '@/src/theme/colors';
import { router } from 'expo-router';
import {
    ArrowLeft,
    Check,
    ChevronRight,
    LogOut,
    Moon,
    Smartphone,
    Sun,
    User,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { themeMode, setThemeMode, isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    
    if (data?.display_name) {
      setDisplayName(data.display_name);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', user.id);
    
    setIsSaving(false);
    
    if (error) {
      Alert.alert('Error', 'Could not update name. Please try again.');
    } else {
      setIsEditing(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/');
          },
        },
      ]
    );
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light', icon: <Sun color={colors.text} size={20} /> },
    { mode: 'dark', label: 'Dark', icon: <Moon color={colors.text} size={20} /> },
    { mode: 'system', label: 'System', icon: <Smartphone color={colors.text} size={20} /> },
  ];

  return (
    <ScreenWrapper variant="dawn">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backBtn, { backgroundColor: colors.card }]} 
            onPress={() => router.back()}
          >
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar & Name */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { borderColor: colors.primary }]}>
              <User color={colors.primary} size={40} />
            </View>
          </View>
          
          {isEditing ? (
            <View style={styles.nameEditContainer}>
              <TextInput
                style={[styles.nameInput, { color: colors.text, borderBottomColor: colors.primary }]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                placeholderTextColor={colors.muted}
                autoFocus
                maxLength={30}
              />
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: colors.primary }]} 
                onPress={handleSaveName}
                disabled={isSaving}
              >
                <Check color="white" size={20} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.nameContainer}
              onPress={() => setIsEditing(true)}
            >
              <Text style={[styles.displayName, { color: colors.text }]}>
                {displayName || 'Set your name'}
              </Text>
              <ChevronRight color={colors.muted} size={18} />
            </TouchableOpacity>
          )}
          
          <Text style={[styles.email, { color: colors.muted }]}>{user?.email}</Text>
        </View>

        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <View style={[styles.themeOptions, { backgroundColor: colors.card }]}>
            {themeOptions.map((option, index) => (
              <TouchableOpacity
                key={option.mode}
                style={[
                  styles.themeOption,
                  index < themeOptions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  themeMode === option.mode && { backgroundColor: isDark ? 'rgba(255, 107, 148, 0.1)' : '#FFF0F3' },
                ]}
                onPress={() => setThemeMode(option.mode)}
              >
                {option.icon}
                <Text style={[
                  styles.themeLabel,
                  { color: colors.text },
                  themeMode === option.mode && { color: colors.primary },
                ]}>
                  {option.label}
                </Text>
                {themeMode === option.mode && (
                  <Check color={colors.primary} size={16} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity 
          style={[styles.signOutBtn, isDark && styles.signOutBtnDark]} 
          onPress={handleSignOut}
        >
          <LogOut color="#EF4444" size={20} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '700',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 75, 125, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  displayName: {
    fontFamily: 'Outfit',
    fontSize: 24,
    fontWeight: 'bold',
  },
  nameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    fontFamily: 'Outfit',
    fontSize: 20,
    fontWeight: '600',
    borderBottomWidth: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 150,
    textAlign: 'center',
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  email: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  themeOptions: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  themeLabel: {
    fontFamily: 'Quicksand',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
  },
  signOutBtnDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  signOutText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
