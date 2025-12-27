import { GameType } from '@/src/services/gameService';
import { colors } from '@/src/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Monitor, Users, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { ScreenWrapper } from '../ui/ScreenWrapper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GameSetupProps {
  gameType: GameType;
  onStart: (config: { heatLevel: number; mode: string }) => void;
  onCancel: () => void;
}

export function GameSetup({ gameType, onStart, onCancel }: GameSetupProps) {
  const [heatLevel, setHeatLevel] = useState(1);
  const [mode, setMode] = useState<'in_person' | 'virtual'>('in_person');

  const handleStart = () => {
    onStart({ heatLevel, mode });
  };

  return (
    <ScreenWrapper variant="dusk">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Game Setup</Text>
          <Text style={styles.subtitle}>Customize your experience</Text>
        </View>

        <View style={styles.content}>
          {/* Game Info */}
          <View style={styles.gameCard}>
            <LinearGradient
              colors={(gameType.gradient_colors || [colors.primary, colors.secondary]) as [string, string]}
              style={styles.gameIcon}
            >
                <Zap color="white" size={32} />
            </LinearGradient>
            <View>
              <Text style={styles.gameTitle}>{gameType.name}</Text>
              <Text style={styles.gameDescription}>
                {gameType.description || 'Configure your settings below'}
              </Text>
            </View>
          </View>

          {/* Settings */}
          <View style={styles.settingsContainer}>
            {gameType.has_spice_meter && (
              <View style={styles.settingSection}>
                <Text style={styles.sectionLabel}>Spice Meter 🌶️</Text>
                <View style={styles.optionsRow}>
                  {[1, 2, 3].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.optionButton,
                        heatLevel === level && styles.optionButtonSelected,
                        { borderColor: getHeatColor(level) }
                      ]}
                      onPress={() => setHeatLevel(level)}
                    >
                      <Flame 
                        color={heatLevel === level ? 'white' : getHeatColor(level)} 
                        size={20} 
                        fill={heatLevel === level ? 'white' : 'transparent'}
                      />
                      <Text style={[
                        styles.optionText,
                        heatLevel === level && styles.optionTextSelected
                      ]}>
                        {getHeatLabel(level)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {gameType.has_virtual_mode && (
                <View style={[styles.settingSection, !gameType.has_spice_meter && { marginTop: 0 }]}>
                  <Text style={styles.sectionLabel}>Context 📍</Text>
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        mode === 'in_person' && styles.optionButtonSelected,
                        { borderColor: colors.primary }
                      ]}
                      onPress={() => setMode('in_person')}
                    >
                      <Users color={mode === 'in_person' ? 'white' : colors.primary} size={20} />
                      <Text style={[
                        styles.optionText,
                        mode === 'in_person' && styles.optionTextSelected
                      ]}>In Person</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        mode === 'virtual' && styles.optionButtonSelected,
                        { borderColor: colors.secondary }
                      ]}
                      onPress={() => setMode('virtual')}
                    >
                      <Monitor color={mode === 'virtual' ? 'white' : colors.secondary} size={20} />
                      <Text style={[
                        styles.optionText,
                        mode === 'virtual' && styles.optionTextSelected
                      ]}>Virtual</Text>
                    </TouchableOpacity>
                  </View>
                </View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startButtonGradient}
                >
                    <Text style={styles.startButtonText}>Start Game</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

function getHeatColor(level: number) {
  switch(level) {
    case 1: return '#4CAF50'; // Green
    case 2: return '#FF9800'; // Orange
    case 3: return '#F44336'; // Red
    default: return colors.primary;
  }
}

function getHeatLabel(level: number) {
  switch(level) {
    case 1: return 'Mild';
    case 2: return 'Spicy';
    case 3: return 'Extreme';
    default: return '';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Quicksand',
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  content: {
    flex: 1,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 20,
    marginBottom: 32,
    gap: 16,
  },
  gameIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameTitle: {
    fontFamily: 'Outfit',
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  gameDescription: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    maxWidth: SCREEN_WIDTH - 120,
  },
  settingsContainer: {
    gap: 24,
  },
  settingSection: {
    gap: 12,
  },
  sectionLabel: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'white',
    borderWidth: 1,
  },
  optionText: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  optionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    gap: 16,
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  cancelText: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Outfit',
    fontSize: 16,
  },
  startButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: 'white',
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '700',
  },
});
