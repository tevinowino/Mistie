import { GameType } from '@/src/services/gameService';
import { colors } from '@/src/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Monitor, Users, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Dimensions,
    Platform,
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
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
                <Zap color="white" size={28} />
            </LinearGradient>
            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>{gameType.name}</Text>
              <Text style={styles.gameDescription} numberOfLines={2}>
                {gameType.description || 'Configure your settings below'}
              </Text>
            </View>
          </View>

          {/* Settings */}
          <View style={styles.settingsContainer}>
            {gameType.has_spice_meter && (
              <View style={[styles.settingSection, styles.settingCard]}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>Spice Meter</Text>
                    <Text style={[styles.sectionValue, { color: getHeatColor(heatLevel) }]}>
                        {getHeatLabel(heatLevel)}
                    </Text>
                </View>
                
                <View style={styles.optionsRow}>
                  {[1, 2, 3].map((level) => (
                    <TouchableOpacity
                      key={level}
                      activeOpacity={0.8}
                      style={[
                        styles.optionButton,
                        heatLevel === level && styles.optionButtonSelected,
                        heatLevel === level && { backgroundColor: getHeatColor(level) + '20', borderColor: getHeatColor(level) }
                      ]}
                      onPress={() => setHeatLevel(level)}
                    >
                      <Flame 
                        color={heatLevel === level ? getHeatColor(level) : 'rgba(255,255,255,0.4)'} 
                        size={24} 
                        fill={heatLevel === level ? getHeatColor(level) : 'transparent'}
                      />
                      <Text style={[
                        styles.optionText,
                        heatLevel === level && { color: getHeatColor(level), fontWeight: '700' }
                      ]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {gameType.has_virtual_mode && (
                <View style={[styles.settingSection, styles.settingCard, !gameType.has_spice_meter && { marginTop: 0 }]}>
                   <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>Environment</Text>
                    <Text style={[styles.sectionValue, { color: colors.secondary }]}>
                        {mode === 'in_person' ? 'Together' : 'Remote'}
                    </Text>
                  </View>
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.optionButton,
                        mode === 'in_person' && styles.optionButtonSelected,
                        mode === 'in_person' && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                      ]}
                      onPress={() => setMode('in_person')}
                    >
                      <Users color={mode === 'in_person' ? colors.primary : 'rgba(255,255,255,0.4)'} size={22} />
                      <Text style={[
                        styles.optionText,
                        mode === 'in_person' && { color: colors.primary, fontWeight: '700' }
                      ]}>In Person</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.optionButton,
                        mode === 'virtual' && styles.optionButtonSelected,
                        mode === 'virtual' && { backgroundColor: colors.secondary + '20', borderColor: colors.secondary }
                      ]}
                      onPress={() => setMode('virtual')}
                    >
                      <Monitor color={mode === 'virtual' ? colors.secondary : 'rgba(255,255,255,0.4)'} size={22} />
                      <Text style={[
                        styles.optionText,
                        mode === 'virtual' && { color: colors.secondary, fontWeight: '700' }
                      ]}>Virtual</Text>
                    </TouchableOpacity>
                  </View>
                </View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
            <TouchableOpacity 
                activeOpacity={0.7}
                style={styles.cancelButton} 
                onPress={onCancel}
            >
                <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                activeOpacity={0.9}
                style={styles.startButton} 
                onPress={handleStart}
            >
                <LinearGradient
                  colors={[colors.primary, colors.secondary] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startButtonGradient}
                >
                    <Text style={styles.startButtonText}>Start Game</Text>
                    <Zap color="white" size={20} style={{ marginLeft: 8 }} fill="white" />
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
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 34,
    fontWeight: '700',
    color: 'white',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Quicksand',
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  content: {
    flex: 1,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 24,
    marginBottom: 40,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gameIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontFamily: 'Outfit',
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  gameDescription: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
  },
  settingsContainer: {
    gap: 32,
  },
  settingSection: {
    gap: 16,
  },
  settingCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
  },
  sectionValue: {
      fontFamily: 'Outfit',
      fontSize: 14,
      fontWeight: '600',
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
    paddingVertical: 18,
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  optionButtonSelected: {
    borderWidth: 1.5,
  },
  optionText: {
    fontFamily: 'Outfit',
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 40,
    marginTop: 20,
    gap: 16,
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  cancelText: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '500',
  },
  startButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: {
        width: 0,
        height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8.30,
    elevation: 8,
  },
  startButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: 'white',
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
