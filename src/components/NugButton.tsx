import { colors } from '@/src/theme/colors';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, X } from 'lucide-react-native';
import { useState } from 'react';
import {
    Animated,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface NugButtonProps {
  onSendNug: (type: 'silent' | 'note', content?: string) => void;
  disabled?: boolean;
}

export function NugButton({ onSendNug, disabled }: NugButtonProps) {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleQuickTap = () => {
    if (disabled) return;
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Pulse animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onSendNug('silent');
  };

  const handleLongPress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowNoteModal(true);
  };

  const handleSendNote = () => {
    if (noteText.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSendNug('note', noteText.trim());
      setNoteText('');
      setShowNoteModal(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={handleQuickTap}
        onLongPress={handleLongPress}
        delayLongPress={500}
        disabled={disabled}
        activeOpacity={0.8}
        style={styles.buttonContainer}
      >
        <Animated.View style={[styles.button, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Heart color="white" size={22} fill="white" />
            <Text style={styles.buttonLabel}>Nug</Text>
          </LinearGradient>
        </Animated.View>
        <Text style={styles.hint}>Tap to send love</Text>
      </TouchableOpacity>

      {/* Note Modal */}
      <Modal
        visible={showNoteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setShowNoteModal(false)} 
          />
          
          <View style={styles.modalContent}>
            {/* Glass Background */}
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MessageCircle color={colors.primary} size={20} />
                <Text style={styles.modalTitle}>Send a Note</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNoteModal(false)} hitSlop={10}>
                <X color={colors.muted} size={24} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.noteInput}
              placeholder="Write a love note... (50 chars)"
              placeholderTextColor={colors.muted}
              value={noteText}
              onChangeText={(text) => setNoteText(text.slice(0, 50))}
              maxLength={50}
              autoFocus
              multiline
            />

            <Text style={styles.charCount}>{noteText.length}/50</Text>

            <TouchableOpacity
              style={[styles.sendButton, !noteText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendNote}
              disabled={!noteText.trim()}
            >
              <LinearGradient
                colors={noteText.trim() ? [colors.primary, colors.secondary] : ['#ccc', '#ccc']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendGradient}
              >
                <Text style={styles.sendText}>Send Nug</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  button: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 6,
  },
  buttonLabel: {
    fontFamily: 'Outfit',
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  hint: {
    fontFamily: 'Quicksand',
    fontSize: 11,
    color: colors.muted,
    marginTop: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: 16,
    fontFamily: 'DancingScript',
    fontSize: 22,
    color: colors.text,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: 16,
  },
  sendButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  sendGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
