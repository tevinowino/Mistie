import { colors } from '@/src/theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
} from 'react-native-reanimated';

export interface TutorialContent {
  title: string;
  description: string;
  icon?: React.ReactNode;
  gradientColors?: readonly [string, string];
}

interface TutorialOverlayProps {
  content: TutorialContent;
  gameSlug: string;
  onDismiss: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  content,
  gameSlug,
  onDismiss,
}) => {
  const handleDismiss = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Mark as seen locally
    try {
      await AsyncStorage.setItem(`tutorial_seen_${gameSlug}`, 'true');
    } catch (e) {
      console.warn('Failed to save tutorial state', e);
    }
    onDismiss();
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View 
        entering={FadeIn.duration(400)} 
        exiting={FadeOut.duration(300)}
        style={styles.backdrop}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
      </Animated.View>

      {/* Card */}
      <Animated.View
        entering={SlideInDown.springify().damping(15)}
        exiting={SlideOutDown.duration(300)}
        style={styles.cardContainer}
      >
        <LinearGradient
          colors={['rgba(30,30,40,0.95)', 'rgba(20,20,30,0.98)']}
          style={styles.card}
        >
          {/* Header Graphic */}
          <LinearGradient
            colors={content.gradientColors || [colors.primary, '#651FFF']}
            style={styles.headerGraphic}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {content.icon}
          </LinearGradient>

          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.description}>{content.description}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleDismiss}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={content.gradientColors || [colors.primary, '#651FFF']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Got it</Text>
              <Check color="white" size={18} />
            </LinearGradient>
          </TouchableOpacity>


          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleDismiss}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  headerGraphic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Quicksand',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
  },
  buttonText: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  skipButton: {
    paddingVertical: 12,
    marginTop: 8,
  },
  skipText: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'underline',
  },
});
