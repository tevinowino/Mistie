import { colors } from '@/src/theme/colors';
import * as Haptics from 'expo-haptics';
import { ChevronDown, Flame, MapPin, Video, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

interface GameSettingsDropdownProps {
  currentLevel: number;
  currentMode: string;
  onUpdate: (settings: { heatLevel?: number; mode?: string }) => void;
  style?: StyleProp<ViewStyle>;
}

export function HeatControl({ currentLevel, currentMode, onUpdate, style }: GameSettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const heatLevels = [
    { value: 1, label: 'Mild', emoji: '🌶️', color: '#4CAF50', desc: 'Suggestive but tasteful' },
    { value: 2, label: 'Spicy', emoji: '🔥', color: '#FF9800', desc: 'Getting frisky' },
    { value: 3, label: 'Inferno', emoji: '🌋', color: '#F44336', desc: 'No limits' },
  ];

  const modes = [
    { value: 'in_person', label: 'In-Person', icon: MapPin, desc: 'Physical proximity' },
    { value: 'virtual', label: 'Virtual', icon: Video, desc: 'Long distance' },
  ];

  const currentHeat = heatLevels.find(h => h.value === currentLevel) || heatLevels[1];
  const currentModeObj = modes.find(m => m.value === currentMode) || modes[0];

  const toggleDropdown = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(!isOpen);
  };

  const selectHeat = (level: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpdate({ heatLevel: level });
  };

  const selectMode = (mode: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpdate({ mode });
  };

  return (
    <View style={[styles.wrapper, style]}>
      {/* Trigger Button */}
      <TouchableOpacity 
        style={[styles.trigger, { backgroundColor: currentHeat.color }]}
        onPress={toggleDropdown}
        activeOpacity={0.8}
      >
        <Flame size={18} color="white" fill="white" />
        <Text style={styles.triggerText}>{currentHeat.label}</Text>
        <ChevronDown size={16} color="white" style={{ opacity: 0.7 }} />
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={styles.dropdown}>
            {/* Header */}
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Game Settings</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <X size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Heat Level Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌶️ Spice Level</Text>
              <View style={styles.optionsRow}>
                {heatLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.option,
                      currentLevel === level.value && styles.optionActive,
                      currentLevel === level.value && { borderColor: level.color }
                    ]}
                    onPress={() => selectHeat(level.value)}
                  >
                    <Text style={styles.optionEmoji}>{level.emoji}</Text>
                    <Text style={[
                      styles.optionLabel,
                      currentLevel === level.value && { color: level.color }
                    ]}>{level.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Mode Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📍 Context</Text>
              <View style={styles.modeRow}>
                {modes.map((mode) => {
                  const IconComponent = mode.icon;
                  const isActive = currentMode === mode.value;
                  return (
                    <TouchableOpacity
                      key={mode.value}
                      style={[
                        styles.modeOption,
                        isActive && styles.modeOptionActive
                      ]}
                      onPress={() => selectMode(mode.value)}
                    >
                      <IconComponent 
                        size={20} 
                        color={isActive ? colors.primary : colors.muted} 
                      />
                      <View>
                        <Text style={[
                          styles.modeLabel,
                          isActive && styles.modeLabelActive
                        ]}>{mode.label}</Text>
                        <Text style={styles.modeDesc}>{mode.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Done Button */}
            <TouchableOpacity 
              style={[styles.doneButton, { backgroundColor: currentHeat.color }]}
              onPress={() => setIsOpen(false)}
            >
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 100,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  triggerText: {
    color: 'white',
    fontFamily: 'Outfit',
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdown: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dropdownTitle: {
    color: colors.text,
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.muted,
    fontFamily: 'Outfit',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  optionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  optionLabel: {
    color: colors.text,
    fontFamily: 'Outfit',
    fontSize: 12,
    fontWeight: '600',
  },
  modeRow: {
    gap: 10,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: colors.primary,
  },
  modeLabel: {
    color: colors.text,
    fontFamily: 'Outfit',
    fontSize: 14,
    fontWeight: '600',
  },
  modeLabelActive: {
    color: colors.primary,
  },
  modeDesc: {
    color: colors.muted,
    fontFamily: 'Outfit',
    fontSize: 11,
  },
  doneButton: {
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  doneText: {
    color: 'white',
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '700',
  },
});
