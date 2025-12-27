import { colors } from '@/src/theme/colors';
import * as Haptics from 'expo-haptics';
import { Heart, X } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NugReceivedModalProps {
  visible: boolean;
  nug: { type: 'silent' | 'note'; content?: string } | null;
  partnerName: string;
  onDismiss: () => void;
}

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export function NugReceivedModal({ visible, nug, partnerName, onDismiss }: NugReceivedModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && nug) {
      // Trigger haptic
      if (nug.type === 'silent') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 4 seconds (slightly longer for reading)
      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible, nug]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible || !nug) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleDismiss}>
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleDismiss} />
        
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Glass Background */}
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
            style={StyleSheet.absoluteFill}
          />
          
          <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
            <X color={colors.muted} size={20} />
          </TouchableOpacity>

          <View style={styles.heartContainer}>
            <Heart color={colors.primary} size={48} fill={colors.primary} />
          </View>

          <Text style={styles.title}>
            {nug.type === 'silent' ? '💗 Nug Received!' : `💌 Note from ${partnerName}`}
          </Text>

          {nug.type === 'note' && nug.content && (
            <Text style={styles.noteText}>"{nug.content}"</Text>
          )}

          <Text style={styles.subtitle}>
            {nug.type === 'silent' ? `${partnerName} is thinking of you` : 'Saved to your Nug History'}
          </Text>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', // Fallback /Tint
  },
  container: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden', // For the gradient
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  heartContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE4EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  noteText: {
    fontFamily: 'DancingScript',
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
});
