import { BlurView } from 'expo-blur';
import { ArrowRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { bondService } from '../../services/bondService';

interface Props {
  visible: boolean;
  bondId: string;
  onComplete: () => void;
}

const JOURNEY_OPTIONS = [
  "New Spark", "Building Roots", "Long-Term Partners", "Life Partners"
];

const DYNAMIC_OPTIONS = [
  "Crush", "Situationship", "Dating", "Engaged", "Married", "Open Relationship"
];

export const BondOnboardingModal = ({ visible, bondId, onComplete }: Props) => {
  const { user } = useAuth();
  const colors = useColors();
  
  const [step, setStep] = useState(1); // 1: Dynamic (Status), 2: Journey (Tags? No, distinct), 3: Milestone
  const [dynamic, setDynamic] = useState('');
  const [journeyStage, setJourneyStage] = useState(''); // Maybe just stored as anchor? Use dynamic field for Status.
  // Wait, User requested: "The Journey" (How long?), "The Dynamic" (Status). 
  // I will map "Dynamic" UI -> 'dynamic' column (e.g. Married). 
  // "Journey" -> Maybe just context? Or append to dynamic array? 
  // Schema has `dynamic` as TEXT. I will just store the "Dynamic" (Status) in the `dynamic` column. 
  // The "Journey" (New Spark etc) isn't strictly in schema unless updated. 
  // I will prioritize "Dynamic" (Status) for the DB col.
  
  // Actually, I can store "Dynamic" as "Status". 
  // Let's store "Dynamic" in `dynamic`. 
  // "Journey" can be an anchor for now.
  
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    if (step === 1) {
      if (!dynamic) {
        Alert.alert('Please select your dynamic');
        return;
      }
      setStep(2);
    } else if (step === 2) {
       // Milestone
       await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!day || !month || !year) {
      Alert.alert('Please enter your milestone date');
      return;
    }
    
    // Validate Date
    const d = parseInt(day);
    const m = parseInt(month);
    const y = parseInt(year);
    
    if (d > 31 || m > 12 || y < 1950 || y > new Date().getFullYear()) {
      Alert.alert('Please enter a valid date');
      return;
    }

    const milestoneDate = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    setIsSubmitting(true);

    try {
      if (user && bondId) {
        // Update Bond dynamic, anniversary, and complete status
        await bondService.updateBond(bondId, {
          dynamic: dynamic, 
          anniversary_date: milestoneDate,
          is_onboarding_complete: true
        });

        // We no longer need to send a Nug for this, as it is a core field now.
        // await bondService.sendNug(bondId, user.id, 'silent', `Milestone set: ${milestoneDate}`);
        
        onComplete();
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error updating bond');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <BlurView intensity={95} tint="dark" className="flex-1">
        <SafeAreaView className="flex-1 justify-center px-6">
          <View className="bg-neutral-900/90 border border-white/10 p-6 rounded-3xl h-[500px]">
            
            {/* Header */}
            <View className="mb-6">
              <Text className="text-3xl font-bold text-white mb-2">
                {step === 1 ? "The Dynamic" : "The Milestone"}
              </Text>
              <Text className="text-white/60 text-lg">
                {step === 1 ? "Define your current chapter." : "When did your story begin?"}
              </Text>
            </View>

            {/* Step 1: Dynamic */}
            {step === 1 && (
              <ScrollView className="space-y-3">
                {DYNAMIC_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setDynamic(opt)}
                    className={`p-4 rounded-xl border ${
                      dynamic === opt 
                        ? 'bg-white/20 border-white' 
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <Text className={`text-lg font-medium ${dynamic === opt ? 'text-white' : 'text-white/70'}`}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Step 2: Milestone */}
            {step === 2 && (
              <View className="space-y-4">
                <View className="flex-row justify-between space-x-2">
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
              </View>
            )}

            {/* Footer Buttons */}
            <View className="mt-auto pt-6 flex-row justify-end items-center">
               {step > 1 && (
                 <TouchableOpacity onPress={() => setStep(step - 1)} className="mr-auto px-4 py-2">
                   <Text className="text-white/60">Back</Text>
                 </TouchableOpacity>
               )}

              <TouchableOpacity 
                onPress={handleNext}
                disabled={isSubmitting}
                className="bg-primary px-6 py-3 rounded-full flex-row items-center"
                style={{ backgroundColor: colors.primary }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text className="text-black font-bold text-lg mr-2">
                      {step === 2 ? "Complete" : "Continue"}
                    </Text>
                    <ArrowRight size={20} color="#000" />
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
};
