import { bondService } from '@/src/services/bondService';
import { darkColors } from '@/src/theme/colors';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, Calendar, Check, Heart, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
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
  View
} from 'react-native';

interface Props {
  visible: boolean;
  bondId: string;
  onComplete: () => void;
}

const DYNAMIC_OPTIONS = [
  "New Spark", "Situationship", "Dating", "Engaged", "Married", "Open Relationship", "Long-Term Partners", "Life Partners"
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const BondOnboardingModal = ({ visible, bondId, onComplete }: Props) => {
  // Use darkColors for premium aesthetic
  const colors = darkColors;
  
  const [step, setStep] = useState(1); // 1: Dynamic, 2: Milestone
  const [dynamic, setDynamic] = useState('');
  
  // Date State
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 2;

  const handleNext = async () => {
    if (step === 1) {
      if (!dynamic) {
        Alert.alert('Selection Required', 'Please select your relationship dynamic.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
       await handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
        setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!day || !month || !year) {
      Alert.alert('Date Required', 'Please enter your milestone date.');
      return;
    }
    
    const d = parseInt(day);
    const m = parseInt(month);
    const y = parseInt(year);
    
    if (d > 31 || m > 12 || y < 1950 || y > new Date().getFullYear()) {
      Alert.alert('Invalid Date', 'Please check the date entered.');
      return;
    }

    const milestoneDate = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    setIsSubmitting(true);

    try {
      if (bondId) {
        await bondService.updateBond(bondId, {
          dynamic: dynamic, 
          anniversary_date: milestoneDate,
          is_onboarding_complete: true
        });
        
        onComplete();
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update bond details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressBar = () => {
    const progress = step / totalSteps;
    return (
        <View style={styles.progressContainer}>
            <View style={styles.track}>
                <View style={[styles.bar, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={styles.stepText}>Step {step} of {totalSteps}</Text>
        </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
        <View style={styles.container}>
            {/* Background */}
            <LinearGradient
                colors={['#230b14', '#1f0d14', '#1a0510']} // Deep romantic darks
                style={StyleSheet.absoluteFillObject}
            />
            
            {/* Subtle overlay texture/blur */}
            <BlurView intensity={20} style={StyleSheet.absoluteFillObject} tint="dark" />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        
                        <View style={styles.wizardContainer}>
                            {renderProgressBar()}

                            <View style={styles.spacer} />

                            {/* Step 1: Dynamic */}
                            {step === 1 && (
                                <View>
                                    <View style={styles.iconCircle}>
                                        <Heart color={colors.primary} size={32} fill={colors.primary} />
                                    </View>
                                    <Text style={styles.heading}>The Dynamic</Text>
                                    <Text style={styles.subheading}>How would you describe your current chapter?</Text>
                                    
                                    <View style={styles.optionsGrid}>
                                        {DYNAMIC_OPTIONS.map((opt) => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={[
                                                    styles.optionButton,
                                                    dynamic === opt && { 
                                                        borderColor: colors.primary, 
                                                        backgroundColor: 'rgba(255, 107, 148, 0.15)' 
                                                    }
                                                ]}
                                                onPress={() => setDynamic(opt)}
                                            >
                                                <Text style={[
                                                    styles.optionText,
                                                    dynamic === opt && { color: 'white', fontWeight: 'bold' }
                                                ]}>{opt}</Text>
                                                {dynamic === opt && <Check color={colors.primary} size={18} />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Step 2: Milestone */}
                            {step === 2 && (
                                <View>
                                    <View style={styles.iconCircle}>
                                        <Sparkles color={colors.secondary} size={32} />
                                    </View>
                                    <Text style={styles.heading}>The Beginning</Text>
                                    <Text style={styles.subheading}>When did your story officially start?</Text>
                                    
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
                                                autoFocus
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

                                    <View style={styles.infoBox}>
                                        <Calendar color={colors.secondary} size={20} />
                                        <Text style={styles.infoText}>
                                            We'll use this date to celebrate your milestones together.
                                        </Text>
                                    </View>
                                </View>
                            )}

                            <View style={styles.spacer} />

                            {/* Footer Buttons */}
                            <View style={styles.footerRow}>
                                {step > 1 && (
                                    <TouchableOpacity onPress={handleBack} style={styles.backLink}>
                                        <ArrowLeft color="rgba(255,255,255,0.6)" size={20} />
                                        <Text style={styles.backText}>Back</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity 
                                    style={[styles.nextButton, { marginLeft: 'auto' }]}
                                    onPress={handleNext}
                                    disabled={isSubmitting}
                                >
                                    <LinearGradient
                                        colors={[colors.primary, colors.secondary]}
                                        style={styles.nextGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {isSubmitting ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <>
                                                <Text style={styles.nextText}>
                                                    {step === totalSteps ? "Complete Setup" : "Continue"}
                                                </Text>
                                                <ArrowRight color="white" size={20} />
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                        </View>
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
    marginBottom: 24,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // Dynamic Options
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: '45%',
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  optionText: {
    fontFamily: 'Quicksand',
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },

  // Date Inputs
  dateInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dateInputWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dateLabel: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  dateInput: {
    fontFamily: 'Outfit',
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    width: '100%',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 142, 83, 0.1)', // Secondary tint
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: 'rgba(255, 142, 83, 0.9)',
    lineHeight: 20,
  },

  // Spacer
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  wizardContainer: {
    flex: 1,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
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
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nextText: {
    fontFamily: 'Outfit',
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
  },
});
