import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Profile, profileService } from '@/src/services/profileService';
import { darkColors } from '@/src/theme/colors';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, Check, Edit3, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  visible: boolean;
  onComplete: () => void;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Non-Binary', 'Prefer not to say'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const IndividualOnboardingModal = ({ visible, onComplete }: Props) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  // We'll enforce dark mode aesthetic for this modal as requested ("Mistie premium")
  // but accessible colors are good. Let's stick to the dark theme variables for the "vibe".
  const colors = darkColors; 

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Flow State
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Load Profile
  useEffect(() => {
    loadProfile();
  }, [user, visible]);

  const loadProfile = async () => {
    if (!user || !visible) return;
    setIsLoading(true);

    try {
      const { data } = await profileService.getProfile(user.id);
      setProfile(data);

      if (data) {
        if (data.display_name) setName(data.display_name);
        if (data.gender) setGender(data.gender);
        if (data.birth_date) {
            const [y, m, d] = data.birth_date.split('-');
            setYear(y);
            setMonth(m);
            setDay(d);
        }

        const missing: string[] = [];
        if (!data.birth_date) missing.push('birth_date');
        if (!data.gender) missing.push('gender');
        if (!data.display_name) missing.push('name');
        
        setMissingFields(missing);

        if (missing.length === 0) {
            setShowSummary(true);
        }
      }
    } catch (error) {
        console.error("Error loading profile", error);
    } finally {
        setIsLoading(false);
    }
  };

  const currentField = missingFields[currentFieldIndex];

  // Logic
  const handleNext = () => {
    // Validation
    if (currentField === 'name' && !name.trim()) return Alert.alert('Required', 'Please enter your name.');
    if (currentField === 'gender' && !gender) return Alert.alert('Required', 'Please select a gender.');
    if (currentField === 'birth_date') {
        if (!day || !month || !year) return Alert.alert('Required', 'Please enter your full birth date.');
        const y = parseInt(year);
        if (y < 1900 || y > new Date().getFullYear()) return Alert.alert('Invalid Year', 'Please check the year.');
    }

    if (currentFieldIndex < missingFields.length - 1) {
        setCurrentFieldIndex(currentFieldIndex + 1);
    } else {
        setShowSummary(true);
    }
  };

  const handleBack = () => {
    if (showSummary) {
        // If coming back from summary to edit, ideally we'd go to the specific field, 
        // but for simplicity let's go to the last field.
        // Actually, the edit button logic handles specific field jumps.
        // If we just hit back from summary without an explicit "edit" action? 
        // Let's assume hitting "Back" from summary goes to the last step.
        setShowSummary(false);
        setCurrentFieldIndex(missingFields.length - 1);
    } else if (currentFieldIndex > 0) {
        setCurrentFieldIndex(currentFieldIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
        if (!user) return;

        let birthDate = profile?.birth_date;
        if (day && month && year) {
            birthDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        const updates = {
            display_name: name || profile?.display_name || 'User',
            gender: gender || profile?.gender || undefined,
            birth_date: birthDate || undefined,
            is_onboarding_complete: true
        };

        const { error } = await profileService.updateProfile(user.id, updates);
        if (error) throw error;
        
        onComplete();
    } catch (e) {
        Alert.alert('Error', 'Failed to update profile.');
    } finally {
        setIsSubmitting(false);
    }
  };

  // Render Helpers
  const renderProgressBar = () => {
    if (showSummary || missingFields.length === 0) return null;
    const progress = (currentFieldIndex + 1) / missingFields.length;
    return (
        <View style={styles.progressContainer}>
            <View style={styles.track}>
                <View style={[styles.bar, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={styles.stepText}>Step {currentFieldIndex + 1} of {missingFields.length}</Text>
        </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
        <View style={styles.container}>
            {/* Background */}
            <LinearGradient
                colors={['#0F2027', '#203A43', '#2C5364']}
                style={StyleSheet.absoluteFillObject}
            />
            <BlurView intensity={30} style={StyleSheet.absoluteFillObject} tint="dark" />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        
                        {isLoading ? (
                            <View style={styles.centerContent}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={styles.loadingText}>Loading profile...</Text>
                            </View>
                        ) : showSummary ? (
                            // === SUMMARY VIEW ===
                            <View style={styles.summaryContainer}>
                                <View style={styles.headerCentered}>
                                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                        <Check color={colors.primary} size={40} />
                                    </View>
                                    <Text style={styles.heading}>You're All Set!</Text>
                                    <Text style={styles.subheading}>Review your details below.</Text>
                                </View>

                                <View style={styles.card}>
                                    {/* Name */}
                                    <View style={styles.summaryRow}>
                                        <View>
                                            <Text style={styles.label}>Name</Text>
                                            <Text style={styles.value}>{name || 'Not set'}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => { setShowSummary(false); setCurrentFieldIndex(missingFields.indexOf('name')); }}>
                                            <Edit3 color={colors.primary} size={20} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.divider} />

                                    {/* Gender */}
                                    <View style={styles.summaryRow}>
                                        <View>
                                            <Text style={styles.label}>Gender</Text>
                                            <Text style={styles.value}>{gender || 'Not set'}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => { setShowSummary(false); setCurrentFieldIndex(missingFields.indexOf('gender')); }}>
                                            <Edit3 color={colors.primary} size={20} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.divider} />

                                    {/* Birthday */}
                                    <View style={styles.summaryRow}>
                                        <View>
                                            <Text style={styles.label}>Birthday</Text>
                                            <Text style={styles.value}>{day}/{month}/{year}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => { setShowSummary(false); setCurrentFieldIndex(missingFields.indexOf('birth_date')); }}>
                                            <Edit3 color={colors.primary} size={20} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity 
                                    style={styles.primaryButton}
                                    onPress={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    <LinearGradient
                                        colors={[colors.primary, colors.secondary]}
                                        style={styles.gradientButton}
                                        start={{x:0, y:0}} end={{x:1, y:0}}
                                    >
                                        {isSubmitting ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text style={styles.buttonText}>Complete Setup</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            // === WIZARD VIEW === 
                            <View style={styles.wizardContainer}>
                                {renderProgressBar()}

                                <View style={styles.spacer} />

                                {/* DYNAMIC CONTENT */}
                                {currentField === 'name' && (
                                    <View>
                                        <Text style={styles.heading}>What should we call you?</Text>
                                        <Text style={styles.subheading}>Your partner will see this name.</Text>
                                        
                                        <View style={styles.inputContainer}>
                                            <User color={colors.primary} size={24} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter your name"
                                                placeholderTextColor="rgba(255,255,255,0.4)"
                                                value={name}
                                                onChangeText={setName}
                                                autoFocus
                                            />
                                        </View>
                                    </View>
                                )}

                                {currentField === 'gender' && (
                                    <View>
                                        <Text style={styles.heading}>What is your gender?</Text>
                                        <Text style={styles.subheading}>This helps us personalize content.</Text>
                                        
                                        <View style={styles.optionsContainer}>
                                            {GENDER_OPTIONS.map(opt => (
                                                <TouchableOpacity
                                                    key={opt}
                                                    style={[
                                                        styles.optionButton,
                                                        gender === opt && { borderColor: colors.primary, backgroundColor: 'rgba(255,255,255,0.1)' }
                                                    ]}
                                                    onPress={() => setGender(opt)}
                                                >
                                                    <Text style={[
                                                        styles.optionText,
                                                        gender === opt && { color: 'white', fontWeight: 'bold' }
                                                    ]}>{opt}</Text>
                                                    {gender === opt && <Check color={colors.primary} size={20} />}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {currentField === 'birth_date' && (
                                    <View>
                                        <Text style={styles.heading}>When is your birthday?</Text>
                                        <Text style={styles.subheading}>We use this to confirm age eligibility.</Text>
                                        
                                        <View style={styles.dateInputsRow}>
                                            <View style={styles.dateInputWrapper}>
                                                <Text style={styles.dateLabel}>Day</Text>
                                                <TextInput
                                                    style={styles.dateInput}
                                                    placeholder="DD"
                                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                                    keyboardType="numeric"
                                                    maxLength={2}
                                                    value={day}
                                                    onChangeText={setDay}
                                                />
                                            </View>
                                            <View style={styles.dateInputWrapper}>
                                                <Text style={styles.dateLabel}>Month</Text>
                                                <TextInput
                                                    style={styles.dateInput}
                                                    placeholder="MM"
                                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                                    keyboardType="numeric"
                                                    maxLength={2}
                                                    value={month}
                                                    onChangeText={setMonth}
                                                />
                                            </View>
                                            <View style={[styles.dateInputWrapper, { flex: 1.5 }]}>
                                                <Text style={styles.dateLabel}>Year</Text>
                                                <TextInput
                                                    style={styles.dateInput}
                                                    placeholder="YYYY"
                                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                                    keyboardType="numeric"
                                                    maxLength={4}
                                                    value={year}
                                                    onChangeText={setYear}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                )}

                                <View style={styles.spacer} />

                                {/* Navigation */}
                                <View style={styles.footerRow}>
                                    {currentFieldIndex > 0 && (
                                        <TouchableOpacity onPress={handleBack} style={styles.backLink}>
                                            <ArrowLeft color="rgba(255,255,255,0.6)" size={20} />
                                            <Text style={styles.backText}>Back</Text>
                                        </TouchableOpacity>
                                    )}
                                    
                                    <TouchableOpacity 
                                        style={[styles.nextButton, { marginLeft: 'auto' }]}
                                        onPress={handleNext}
                                    >
                                        <LinearGradient
                                            colors={[colors.primary, colors.secondary]}
                                            style={styles.nextGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Text style={styles.nextText}>Continue</Text>
                                            <ArrowRight color="white" size={20} />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Quicksand',
    fontSize: 16,
  },
  
  // Progress
  progressContainer: {
    marginBottom: 40,
  },
  track: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginBottom: 8,
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
  stepText: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'right',
  },

  // Headers
  heading: {
    fontFamily: 'Outfit',
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subheading: {
    fontFamily: 'Quicksand',
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 32,
  },
  headerCentered: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  // Inputs
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    marginLeft: 16,
    fontFamily: 'Quicksand',
    fontSize: 20,
    color: 'white',
  },
  
  // Options (Gender)
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionText: {
    fontFamily: 'Quicksand',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },

  // Date Inputs
  dateInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  dateLabel: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  dateInput: {
    fontFamily: 'Outfit',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    width: '100%',
  },

  // Spacer
  spacer: {
    flex: 1,
    minHeight: 40,
  },

  // Footer/Buttons
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  backText: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Quicksand',
    fontSize: 16,
  },
  nextButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextGradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },

  // Summary Card
  summaryContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  wizardContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontFamily: 'Outfit',
    fontSize: 18,
    color: 'white',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
