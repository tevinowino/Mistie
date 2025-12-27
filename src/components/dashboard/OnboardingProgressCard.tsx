import { ArrowRight, Sparkles } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { useOnboardingStatus } from '../../hooks/useOnboardingStatus';

interface Props {
  onOpenIndividual: () => void;
  onOpenBond: () => void;
}

export const OnboardingProgressCard = ({ onOpenIndividual, onOpenBond }: Props) => {
  const { isUserProfileComplete, isBondProfileComplete, bond } = useOnboardingStatus();
  const colors = useColors();
  
  // If both are complete, show nothing
  if (isUserProfileComplete && isBondProfileComplete) return null;

  return (
    <View className="mb-6">
      <View className="bg-neutral-900 border border-white/10 rounded-2xl p-4 overflow-hidden relative">
        {/* Background Accent */}
        <View 
          className="absolute right-0 top-0 w-32 h-32 opacity-10 rounded-full blur-2xl"
          style={{ backgroundColor: colors.primary }}
        />

        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center space-x-2">
            <Sparkles size={18} color={colors.primary} />
            <Text className="text-white font-bold text-lg">Complete Setup</Text>
          </View>
          <Text className="text-white/40 text-xs font-medium uppercase tracking-wider">
            Required
          </Text>
        </View>

        <Text className="text-white/60 mb-4 leading-5">
          Unlock personalized games and tracking by finishing your profiles.
        </Text>

        <View className="space-y-3">
          {!isUserProfileComplete && (
            <TouchableOpacity 
              onPress={onOpenIndividual}
              className="bg-white/5 border border-white/10 p-3 rounded-xl flex-row items-center justify-between active:bg-white/10"
            >
              <Text className="text-white font-medium">Your Profile</Text>
              <View className="bg-white/10 p-1.5 rounded-full">
                <ArrowRight size={14} color="white" />
              </View>
            </TouchableOpacity>
          )}

          {!isBondProfileComplete && bond && (
            <TouchableOpacity 
              onPress={onOpenBond}
              className="bg-white/5 border border-white/10 p-3 rounded-xl flex-row items-center justify-between active:bg-white/10"
            >
              <Text className="text-white font-medium">Relationship Profile</Text>
              <View className="bg-white/10 p-1.5 rounded-full">
                <ArrowRight size={14} color="white" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};
