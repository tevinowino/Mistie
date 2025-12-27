import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BottleSpinnerProps {
  myName: string;
  partnerName: string;
  isUser1: boolean;
  spinResult: 'user_1' | 'user_2' | null;
  isSpinning: boolean;
  spinComplete: boolean;
  onSpin: () => void;
  onContinue?: () => void;
  disabled?: boolean;
}

export const BottleSpinner: React.FC<BottleSpinnerProps> = ({
  myName,
  partnerName,
  isUser1,
  spinResult,
  isSpinning,
  spinComplete,
  onSpin,
  onContinue,
  disabled = false,
}) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Calculate final rotation based on result
  const getTargetRotation = (result: 'user_1' | 'user_2') => {
    // user_1 is at top (0°), user_2 is at bottom (180°)
    // Add extra rotations for dramatic effect
    const baseRotations = 4; // Full spins before landing
    const finalAngle = result === 'user_1' ? 0 : 180;
    return baseRotations * 360 + finalAngle;
  };

  // Animate spin when result comes in
  useEffect(() => {
    if (isSpinning && spinResult) {
      const targetRotation = getTargetRotation(spinResult);
      
      Animated.timing(rotation, {
        toValue: targetRotation,
        duration: 3000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [isSpinning, spinResult]);

  // Reset rotation when starting fresh
  useEffect(() => {
    if (!spinResult && !isSpinning) {
      rotation.setValue(0);
    }
  }, [spinResult, isSpinning]);

  // Pulse animation for the spin button
  useEffect(() => {
    if (!spinComplete && !isSpinning && !spinResult) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [spinComplete, isSpinning, spinResult]);

  const rotationInterpolate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  // Determine who the result points to
  const getResultName = () => {
    if (!spinResult) return '';
    if (spinResult === 'user_1') {
      return isUser1 ? myName : partnerName;
    } else {
      return isUser1 ? partnerName : myName;
    }
  };

  const resultName = getResultName();
  const isResultMe = spinResult === (isUser1 ? 'user_1' : 'user_2');

  return (
    <View style={styles.container}>
      {/* Player labels */}
      <View style={styles.playersContainer}>
        <View style={styles.playerLabel}>
          <View style={[styles.playerDot, { backgroundColor: '#FF6B6B' }]} />
          <Text style={styles.playerName}>{isUser1 ? myName : partnerName}</Text>
        </View>
        
        <View style={styles.playerLabel}>
          <View style={[styles.playerDot, { backgroundColor: '#4ECDC4' }]} />
          <Text style={styles.playerName}>{isUser1 ? partnerName : myName}</Text>
        </View>
      </View>

      {/* Spinner area */}
      <View style={styles.spinnerArea}>
        {/* Background circle */}
        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          style={styles.spinnerCircle}
        >
          {/* Colored halves */}
          <View style={styles.halfTop}>
            <LinearGradient
              colors={['#FF6B6B', '#FF8E8E']}
              style={styles.halfGradient}
            />
          </View>
          <View style={styles.halfBottom}>
            <LinearGradient
              colors={['#4ECDC4', '#6EE7DF']}
              style={styles.halfGradient}
            />
          </View>

          {/* Rotating bottle/arrow */}
          <Animated.View
            style={[
              styles.bottleContainer,
              { transform: [{ rotate: rotationInterpolate }] },
            ]}
          >
            <View style={styles.bottle}>
              <View style={styles.bottleNeck} />
              <View style={styles.bottleBody} />
            </View>
          </Animated.View>

          {/* Center button */}
          {!spinComplete && !isSpinning && (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.spinButton, disabled && styles.spinButtonDisabled]}
                onPress={onSpin}
                disabled={disabled || isSpinning}
                activeOpacity={0.8}
              >
                <Text style={styles.spinButtonText}>
                  {isSpinning ? '...' : 'SPIN'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Spinning indicator */}
          {isSpinning && !spinComplete && (
            <View style={styles.spinningIndicator}>
              <Text style={styles.spinningText}>🎲</Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Result display with Continue button */}
      {spinComplete && spinResult && (
        <View style={styles.resultContainer}>
          <LinearGradient
            colors={isResultMe ? ['#FF6B6B', '#FF8E8E'] : ['#4ECDC4', '#6EE7DF']}
            style={styles.resultBadge}
          >
            <Text style={styles.resultEmoji}>{isResultMe ? '😅' : '😏'}</Text>
            <Text style={styles.resultText}>
              {resultName} does the dare!
            </Text>
          </LinearGradient>
          
          {/* Continue button */}
          {onContinue && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={onContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Next Dare</Text>
              <ChevronRight color="white" size={20} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  playerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  playerName: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  spinnerArea: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  halfTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    overflow: 'hidden',
  },
  halfBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    overflow: 'hidden',
  },
  halfGradient: {
    flex: 1,
    opacity: 0.6,
  },
  bottleContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottle: {
    alignItems: 'center',
  },
  bottleNeck: {
    width: 12,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  bottleBody: {
    width: 30,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginTop: -5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  spinButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spinButtonDisabled: {
    opacity: 0.5,
  },
  spinButtonText: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '700',
    color: '#6A1B9A',
  },
  spinningIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinningText: {
    fontSize: 32,
  },
  resultContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 12,
  },
  resultEmoji: {
    fontSize: 28,
  },
  resultText: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  continueButtonText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
