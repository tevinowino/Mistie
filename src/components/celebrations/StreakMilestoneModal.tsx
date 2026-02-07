import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Sparkles, X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StreakMilestoneModalProps {
  visible: boolean;
  streakCount: number;
  onClose: () => void;
}

// Confetti particle component
const ConfettiParticle = ({ delay, color, startX }: { delay: number; color: string; startX: number }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(-50);
      translateX.setValue(0);
      rotate.setValue(0);
      opacity.setValue(1);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT + 100,
          duration: 3000 + Math.random() * 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: (Math.random() - 0.5) * 150,
          duration: 3000 + Math.random() * 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 3000 + Math.random() * 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 3000,
          delay: delay + 1500,
          useNativeDriver: true,
        }),
      ]).start();
    };

    animate();
  }, []);

  const rotateInterpolation = rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          left: startX,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolation },
          ],
          opacity,
        },
      ]}
    />
  );
};

const CONFETTI_COLORS = ['#FF4B7D', '#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#F472B6'];

export const StreakMilestoneModal: React.FC<StreakMilestoneModalProps> = ({
  visible,
  streakCount,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Bounce in animation
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const getMessage = (count: number): { title: string; subtitle: string } => {
    if (count >= 365) return { title: "A YEAR OF LOVE! 💍", subtitle: "You've proven your dedication" };
    if (count >= 100) return { title: "LEGENDARY! 🏆", subtitle: "100 days of pure connection" };
    if (count >= 50) return { title: "UNSTOPPABLE! 💪", subtitle: "50 days and counting!" };
    if (count >= 20) return { title: "ON FIRE! 🔥", subtitle: "20 days of daily dews" };
    if (count >= 10) return { title: "AMAZING! ✨", subtitle: "10 days in a row!" };
    if (count >= 5) return { title: "GREAT WORK! 🌟", subtitle: "5 day streak achieved!" };
    if (count >= 3) return { title: "NICE! 👏", subtitle: "3 days connected!" };
    return { title: "STREAK!", subtitle: `${count} days!` };
  };

  const { title, subtitle } = getMessage(streakCount);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  // Generate confetti particles
  const confettiParticles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    delay: i * 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    startX: Math.random() * SCREEN_WIDTH,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti */}
        {confettiParticles.map((particle) => (
          <ConfettiParticle
            key={particle.id}
            delay={particle.delay}
            color={particle.color}
            startX={particle.startX}
          />
        ))}

        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Glow effect */}
          <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

          <LinearGradient
            colors={['#FF4B7D', '#FF6B6B', '#FFD700']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X color="rgba(255,255,255,0.7)" size={24} />
            </TouchableOpacity>

            {/* Icon */}
            <View style={styles.iconContainer}>
              <Flame color="#FFD700" size={48} />
              <Sparkles color="#FFF" size={24} style={styles.sparkle1} />
              <Sparkles color="#FFF" size={16} style={styles.sparkle2} />
            </View>

            {/* Streak Count */}
            <View style={styles.countContainer}>
              <Text style={styles.countNumber}>{streakCount}</Text>
              <Text style={styles.countLabel}>DAY STREAK</Text>
            </View>

            {/* Message */}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {/* CTA */}
            <TouchableOpacity style={styles.ctaButton} onPress={onClose}>
              <Text style={styles.ctaText}>Keep Going! 🎯</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: SCREEN_WIDTH * 0.85,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#FF4B7D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  glow: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    backgroundColor: '#FF4B7D',
    borderRadius: 100,
  },
  gradient: {
    padding: 32,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  sparkle1: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 10,
    left: 5,
  },
  countContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  countNumber: {
    fontFamily: 'Outfit',
    fontSize: 72,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  countLabel: {
    fontFamily: 'Outfit',
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 4,
    marginTop: -8,
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Quicksand',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
  },
  ctaButton: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4B7D',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});

export default StreakMilestoneModal;
