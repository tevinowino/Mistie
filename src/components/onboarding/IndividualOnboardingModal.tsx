import { BlurView } from 'expo-blur';
import { ArrowRight, Check, Edit3, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { Profile, profileService } from '../../services/profileService';

interface Props {
  visible: boolean;
  onComplete: () => void;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Non-Binary', 'Prefer not to say'];

export const IndividualOnboardingModal = ({ visible, onComplete }: Props) => {
  const { user } = useAuth();
  const colors = useColors();
  
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Determine which fields are missing
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  
  // Editable values
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [user, visible]);

  const loadProfile = async () => {
    if (!user || !visible) return;
    setIsLoading(true);
    
    const { data } = await profileService.getProfile(user.id);
    setProfile(data);
    
    if (data) {
      // Pre-populate existing values
      if (data.display_name) setName(data.display_name);
      if (data.gender) setGender(data.gender);
      if (data.birth_date) {
        const [y, m, d] = data.birth_date.split('-');
        setYear(y);
        setMonth(m);
        setDay(d);
      }
      
      // Determine missing fields
      const missing: string[] = [];
      if (!data.birth_date) missing.push('birth_date');
      if (!data.gender) missing.push('gender');
      // Name is usually set during signup, but if missing, add it
      if (!data.display_name) missing.push('name');
      
      setMissingFields(missing);
      
      // If nothing is missing, just show summary
      if (missing.length === 0) {
        setShowSummary(true);
      }
    }
    
    setIsLoading(false);
  };

  const handleNextField = () => {
    // Validate current field
    const currentField = missingFields[currentFieldIndex];
    
    if (currentField === 'name' && !name.trim()) {
      Alert.alert('Please enter your name');
      return;
    }
    if (currentField === 'gender' && !gender) {
      Alert.alert('Please select your gender');
      return;
    }
    if (currentField === 'birth_date') {
      if (!day || !month || !year) {
        Alert.alert('Please enter your full birth date');
        return;
      }
      const d = parseInt(day);
      const m = parseInt(month);
      const y = parseInt(year);
      if (d > 31 || m > 12 || y < 1920 || y > new Date().getFullYear()) {
        Alert.alert('Please enter a valid date');
        return;
      }
    }
    
    // Move to next field or summary
    if (currentFieldIndex < missingFields.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      if (user) {
        // Build birth date - use local state if set, otherwise fall back to profile
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
        
        console.log('Saving profile updates:', updates);
        
        const { error } = await profileService.updateProfile(user.id, updates);
        
        if (error) {
          console.error('Profile update error:', error);
          Alert.alert('Error', 'Failed to save profile. Please try again.');
          return;
        }
        
        console.log('Profile saved successfully');
        onComplete();
      }
    } catch (e) {
      console.error('handleSubmit error:', e);
      Alert.alert('Error updating profile');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!visible) return null;

  const currentField = missingFields[currentFieldIndex];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <BlurView intensity={95} tint="dark" className="flex-1">
        <SafeAreaView className="flex-1 justify-center px-6">
          <View className="bg-neutral-900/95 border border-white/10 p-6 rounded-3xl max-h-[600px]">
            
            {isLoading ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-white/60 mt-4">Loading your profile...</Text>
              </View>
            ) : showSummary ? (
              // SUMMARY / EDIT SCREEN
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="items-center mb-6">
                  <View className="w-20 h-20 rounded-full bg-white/10 items-center justify-center mb-4">
                    <User size={40} color={colors.primary} />
                  </View>
                  <Text className="text-2xl font-bold text-white">Your Profile</Text>
                  <Text className="text-white/60 mt-1">Review and update your details</Text>
                </View>

                {/* Name */}
                <View className="mb-4">
                  <Text className="text-white/40 text-xs uppercase tracking-wider mb-2">Name</Text>
                  <View className="bg-white/5 border border-white/10 rounded-xl p-4 flex-row items-center">
                    <Text className="text-white text-lg flex-1">{name || 'Not set'}</Text>
                    <TouchableOpacity onPress={() => { setMissingFields(['name']); setCurrentFieldIndex(0); setShowSummary(false); }}>
                      <Edit3 size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Gender */}
                <View className="mb-4">
                  <Text className="text-white/40 text-xs uppercase tracking-wider mb-2">Gender</Text>
                  <View className="bg-white/5 border border-white/10 rounded-xl p-4 flex-row items-center">
                    <Text className="text-white text-lg flex-1">{gender || 'Not set'}</Text>
                    <TouchableOpacity onPress={() => { setMissingFields(['gender']); setCurrentFieldIndex(0); setShowSummary(false); }}>
                      <Edit3 size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Birth Date */}
                <View className="mb-6">
                  <Text className="text-white/40 text-xs uppercase tracking-wider mb-2">Birth Date</Text>
                  <View className="bg-white/5 border border-white/10 rounded-xl p-4 flex-row items-center">
                    <Text className="text-white text-lg flex-1">
                      {day && month && year ? `${day}/${month}/${year}` : 'Not set'}
                    </Text>
                    <TouchableOpacity onPress={() => { setMissingFields(['birth_date']); setCurrentFieldIndex(0); setShowSummary(false); }}>
                      <Edit3 size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity 
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-primary py-4 rounded-full flex-row items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <>
                      <Check size={20} color="#000" />
                      <Text className="text-black font-bold text-lg ml-2">Save Profile</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            ) : (
              // INDIVIDUAL FIELD INPUT
              <>
                {/* Header */}
                <View className="mb-6">
                  <Text className="text-white/40 text-xs uppercase tracking-wider mb-1">
                    Step {currentFieldIndex + 1} of {missingFields.length}
                  </Text>
                  <Text className="text-3xl font-bold text-white mb-2">
                    {currentField === 'name' && "What's your name?"}
                    {currentField === 'gender' && "What's your gender?"}
                    {currentField === 'birth_date' && "When were you born?"}
                  </Text>
                  <Text className="text-white/60">
                    {currentField === 'birth_date' && "This helps us verify 18+ content access."}
                    {currentField === 'gender' && "This helps personalize your experience."}
                  </Text>
                </View>

                {/* Name Input */}
                {currentField === 'name' && (
                  <View className="flex-row items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-6">
                    <User color={colors.primary} size={20} />
                    <TextInput
                      className="flex-1 ml-3 text-white text-lg"
                      placeholder="Your name or nickname"
                      placeholderTextColor="#666"
                      value={name}
                      onChangeText={setName}
                      autoFocus
                    />
                  </View>
                )}

                {/* Gender Selection */}
                {currentField === 'gender' && (
                  <View className="space-y-3 mb-6">
                    {GENDER_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => setGender(opt)}
                        className={`p-4 rounded-xl border ${
                          gender === opt 
                            ? 'bg-white/20 border-white' 
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <Text className={`text-lg ${gender === opt ? 'text-white font-bold' : 'text-white/70'}`}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Birth Date Input */}
                {currentField === 'birth_date' && (
                  <View className="flex-row justify-between space-x-2 mb-6">
                    <View className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 items-center">
                      <Text className="text-white/40 text-xs mb-1">Day</Text>
                      <TextInput
                        className="text-white text-xl font-bold text-center w-full"
                        placeholder="DD"
                        placeholderTextColor="#444"
                        value={day}
                        onChangeText={setDay}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                    <View className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 items-center">
                      <Text className="text-white/40 text-xs mb-1">Month</Text>
                      <TextInput
                        className="text-white text-xl font-bold text-center w-full"
                        placeholder="MM"
                        placeholderTextColor="#444"
                        value={month}
                        onChangeText={setMonth}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                    <View className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 items-center">
                      <Text className="text-white/40 text-xs mb-1">Year</Text>
                      <TextInput
                        className="text-white text-xl font-bold text-center w-full"
                        placeholder="YYYY"
                        placeholderTextColor="#444"
                        value={year}
                        onChangeText={setYear}
                        keyboardType="numeric"
                        maxLength={4}
                      />
                    </View>
                  </View>
                )}

                {/* Navigation */}
                <View className="flex-row justify-end items-center">
                  {currentFieldIndex > 0 && (
                    <TouchableOpacity 
                      onPress={() => setCurrentFieldIndex(currentFieldIndex - 1)} 
                      className="mr-auto px-4 py-2"
                    >
                      <Text className="text-white/60">Back</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    onPress={handleNextField}
                    className="bg-primary px-6 py-3 rounded-full flex-row items-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-black font-bold text-lg mr-2">Continue</Text>
                    <ArrowRight size={20} color="#000" />
                  </TouchableOpacity>
                </View>
              </>
            )}

          </View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
};
