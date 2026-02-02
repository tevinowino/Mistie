import { BreakBondModal } from '@/src/components/profile/BreakBondModal';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { useAuth } from '@/src/context/AuthContext';
import { useNetwork } from '@/src/context/NetworkContext'; // NEW
import { useTheme } from '@/src/context/ThemeContext';
import { useOnboardingStatus } from '@/src/hooks/useOnboardingStatus';
import { bondService } from '@/src/services/bondService';
import { profileService } from '@/src/services/profileService';
import { darkColors, lightColors } from '@/src/theme/colors';
import { router } from 'expo-router';
import { AlertTriangle, ArrowLeft, Bell, Check, ChevronRight, Heart, LogOut, Moon, Save, Smartphone, Sun, User, WifiOff } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-Binary', 'Prefer not to say'];
const DYNAMIC_OPTIONS = ["Crush", "Situationship", "Dating", "Engaged", "Married", "Open Relationship"];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { isDark, themeMode, setThemeMode } = useTheme();
  const { isConnected } = useNetwork(); // NEW
  const colors = isDark ? darkColors : lightColors;
  const { bond, refreshStatus } = useOnboardingStatus();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showBreakBondModal, setShowBreakBondModal] = useState(false);

  // Personal Info
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  // DOB
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  // Bond Info
  const [partnerName, setPartnerName] = useState('');
  const [dynamic, setDynamic] = useState('');
  // Anniversary
  const [annDay, setAnnDay] = useState('');
  const [annMonth, setAnnMonth] = useState('');
  const [annYear, setAnnYear] = useState('');

  // Settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (user && isConnected) {
       loadData();
    } else {
       setIsLoading(false);
    }
  }, [user, isConnected]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // 1. Load Profile
      const { data: profile } = await profileService.getProfile(user.id);
      if (profile) {
        setName(profile.display_name || '');
        setGender(profile.gender || '');
        setNotificationsEnabled(profile.notifications_enabled ?? true);
        if (profile.birth_date) {
          const [y, m, d] = profile.birth_date.split('-');
          setDobYear(y);
          setDobMonth(m);
          setDobDay(d);
        }
      }

      // 2. Load Bond
      const { data: bondData } = await bondService.getUserBond(user.id);
      if (bondData) {
        setDynamic(bondData.dynamic || '');
        if (bondData.anniversary_date) {
          const [y, m, d] = bondData.anniversary_date.split('-');
          setAnnYear(y);
          setAnnMonth(m);
          setAnnDay(d);
        }
        
        // Load Partner Name
        const { data: partnerProfile } = await bondService.getPartnerProfile(bondData, user.id);
        if (partnerProfile?.display_name) {
          setPartnerName(partnerProfile.display_name);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBreakBond = async () => {
    if (!isConnected) {
        Alert.alert("Offline", "You cannot break a bond while offline.");
        return;
    }
    if (!bond || !bond.id) return;
    try {
      const { error } = await bondService.breakBond(bond.id);
      if (error) throw error;
      
      setShowBreakBondModal(false);
      await refreshStatus(); // Update context
      
      // Navigate to dashboard where unlinked state will be shown
      router.replace('/(tabs)' as any); 
      
      // Optional: Show success
      // Alert.alert('Bond Broken', 'You have successfully disconnected.'); 
    } catch (err) {
      console.error('Failed to break bond:', err);
      Alert.alert('Error', 'Failed to break bond. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!isConnected) {
        Alert.alert("Offline", "Please check your internet connection to save changes.");
        return;
    }
    setIsSaving(true);
    
    try {
      // 1. Save Profile
      const birthDate = (dobYear && dobMonth && dobDay) 
        ? `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`
        : null;

      const { error: profileError } = await profileService.updateProfile(user.id, {
        display_name: name,
        gender: gender,
        birth_date: birthDate || undefined,
      });

      if (profileError) throw profileError;

      // 2. Save Bond (if exists)
      if (bond && bond.id) {
        const anniversaryDate = (annYear && annMonth && annDay)
          ? `${annYear}-${annMonth.padStart(2, '0')}-${annDay.padStart(2, '0')}`
          : null;

        const { error: bondError } = await bondService.updateBond(bond.id, {
          dynamic: dynamic,
          anniversary_date: anniversaryDate,
        });

        if (bondError) throw bondError;
      }

      // Refresh global context
      await refreshStatus();
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
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
            router.replace('/(auth)/login');
          } 
        }
      ]
    );
  };

  const renderDateInput = (
    d: string, setD: (v: string) => void,
    m: string, setM: (v: string) => void,
    y: string, setY: (v: string) => void
  ) => (
    <View style={[styles.dateInputContainer, !isConnected && {opacity: 0.6}]}>
      <TextInput
        style={[styles.dateInput, { borderColor: 'rgba(0,0,0,0.1)', color: colors.text }]}
        placeholder="DD"
        placeholderTextColor={colors.muted}
        value={d}
        onChangeText={setD}
        keyboardType="number-pad"
        maxLength={2}
        editable={isConnected}
      />
      <TextInput
        style={[styles.dateInput, { borderColor: 'rgba(0,0,0,0.1)', color: colors.text }]}
        placeholder="MM"
        placeholderTextColor={colors.muted}
        value={m}
        onChangeText={setM}
        keyboardType="number-pad"
        maxLength={2}
        editable={isConnected}
      />
      <TextInput
        style={[styles.dateInput, { flex: 1.5, borderColor: 'rgba(0,0,0,0.1)', color: colors.text }]}
        placeholder="YYYY"
        placeholderTextColor={colors.muted}
        value={y}
        onChangeText={setY}
        keyboardType="number-pad"
        maxLength={4}
        editable={isConnected}
      />
    </View>
  );

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light', icon: <Sun color={colors.text} size={20} /> },
    { mode: 'dark', label: 'Dark', icon: <Moon color={colors.text} size={20} /> },
    { mode: 'system', label: 'System', icon: <Smartphone color={colors.text} size={20} /> },
  ];

  if (isLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        {/* Offline Warning */}
        {!isConnected && (
            <View style={[styles.offlineBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5' }]}>
                <WifiOff color={isDark ? '#FCA5A5' : '#EF4444'} size={20} />
                <Text style={[styles.offlineText, { color: isDark ? '#FECACA' : '#991B1B' }]}>
                    You are offline. Some features will be limited till you're back online.
                </Text>
            </View>
        )}

        {/* PERSONAL INFO */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Info</Text>
          </View>

          <View style={[styles.inputGroup, !isConnected && {opacity: 0.6}]}>
            <Text style={[styles.label, { color: colors.muted }]}>Full Name</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  color: colors.text 
                }
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.muted}
              editable={isConnected}
            />
          </View>

          <View style={[styles.inputGroup, !isConnected && {opacity: 0.6}]}>
            <Text style={[styles.label, { color: colors.muted }]}>Gender</Text>
            <View style={styles.genderOptions}>
              {GENDER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.optionChip,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                    gender === opt && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => isConnected && setGender(opt)}
                  disabled={!isConnected}
                >
                  <Text style={[
                    styles.optionText,
                    { color: gender === opt ? 'white' : colors.text }
                  ]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Date of Birth</Text>
            {renderDateInput(dobDay, setDobDay, dobMonth, setDobMonth, dobYear, setDobYear)}
          </View>
        </View>

        {/* BOND INFO */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Relationship</Text>
          </View>

          {bond ? (
            <>
              <View style={[styles.inputGroup, !isConnected && {opacity: 0.6}]}>
                <Text style={[styles.label, { color: colors.muted }]}>Dynamic</Text>
                <View style={styles.genderOptions}>
                  {DYNAMIC_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.optionChip,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                        dynamic === opt && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => isConnected && setDynamic(opt)}
                      disabled={!isConnected}
                    >
                      <Text style={[
                        styles.optionText,
                        { color: dynamic === opt ? 'white' : colors.text }
                      ]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>Anniversary Date</Text>
                {renderDateInput(annDay, setAnnDay, annMonth, setAnnMonth, annYear, setAnnYear)}
              </View>
            </>
          ) : (
             <Text style={[styles.noBondText, { color: colors.muted }]}>
               Partner not connected yet.
             </Text>
          )}
        </View>
        
        {/* APPEARANCE */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <View style={[styles.themeOptions, { 
            backgroundColor: colors.card, 
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
            borderWidth: 1 
          }]}>
            {themeOptions.map((option, index) => (
              <TouchableOpacity
                key={option.mode}
                style={[
                  styles.themeOption,
                  index < themeOptions.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
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

        <View style={[styles.menuContainer, { 
            backgroundColor: colors.card, 
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
            borderWidth: 1 
          }]}>
            {/* Notification Toggle */}
            <View style={[styles.menuItem, { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
               <View style={[styles.menuIconContainer, { backgroundColor: isDark ? 'rgba(255, 184, 0, 0.1)' : '#FFFBE6' }]}>
                  <Bell size={20} color={isDark ? '#FFB800' : '#F59E0B'} />
               </View>
               <Text style={[styles.menuLabel, { color: colors.text }]}>Push Notifications</Text>
               <Switch
                  trackColor={{ false: isDark ? '#333' : '#E0E0E0', true: colors.primary }}
                  thumbColor={'white'}
                  ios_backgroundColor={isDark ? '#333' : '#E0E0E0'}
                  onValueChange={(val) => {
                     setNotificationsEnabled(val);
                     // Auto-save preference immediately
                     if (isConnected) {
                       profileService.updateProfile(user!.id, { notifications_enabled: val });
                     }
                  }}
                  value={notificationsEnabled}
                  disabled={!isConnected}
               />
            </View>

            {/* Notification History Link */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => isConnected && router.push('/notifications' as any)}
              disabled={!isConnected}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF' }]}>
                 <Smartphone size={20} color="#3B82F6" />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Notification History</Text>
              <ChevronRight size={20} color={colors.muted} />
            </TouchableOpacity>
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary, opacity: isConnected ? 1 : 0.6 }]} 
          onPress={handleSave}
          disabled={isSaving || !isConnected}
        >
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Save size={20} color="white" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

      {/* DANGER ZONE */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
           <AlertTriangle size={18} color="#EF4444" />
           <Text style={[styles.sectionTitle, { color: colors.text }]}>Danger Zone</Text>
        </View>
        
        <TouchableOpacity 
           style={[styles.dangerButton, { backgroundColor: 'rgba(239, 68, 68, 0.08)', opacity: isConnected ? 1 : 0.6 }]}
           onPress={() => isConnected && setShowBreakBondModal(true)}
           disabled={!isConnected}
        >
           <Text style={styles.dangerButtonText}>Break Bond</Text>
        </TouchableOpacity>
      </View>

        {/* LOGOUT */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleSignOut}
        >
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.muted }]}>
          Version 1.0.0 (Beta)
        </Text>

      </ScrollView>

      <BreakBondModal 
        visible={showBreakBondModal}
        onClose={() => setShowBreakBondModal(false)}
        onConfirm={handleBreakBond}
        partnerName={partnerName || 'Partner'}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)', // Dynamic in render
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit',
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  offlineBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      marginBottom: 24,
      borderWidth: 1,
      gap: 12,
  },
  offlineText: {
      fontFamily: 'Quicksand',
      fontSize: 14,
      fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Quicksand',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Quicksand',
    backgroundColor: 'rgba(0,0,0,0.02)', // Dynamic in render
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 0,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Quicksand',
    backgroundColor: 'rgba(0,0,0,0.02)', // Dynamic in render
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)', // Dynamic in render
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Quicksand',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    gap: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Outfit',
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    marginBottom: 24,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontFamily: 'Quicksand',
    fontWeight: '600',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dangerButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontFamily: 'Outfit',
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Quicksand',
    opacity: 0.5,
  },
  noBondText: {
    fontFamily: 'Quicksand',
    fontStyle: 'italic',
  },
  themeOptions: {
    borderRadius: 16,
    overflow: 'hidden',
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
  menuContainer: {
    borderRadius: 16,
    marginBottom: 32,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontFamily: 'Quicksand',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});
