import { useTheme } from '@/src/context/ThemeContext';
import { darkColors, lightColors } from '@/src/theme/colors';
import { BlurView } from 'expo-blur';
import { AlertTriangle, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface BreakBondModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  partnerName: string;
}

export const BreakBondModal: React.FC<BreakBondModalProps> = ({
  visible,
  onClose,
  onConfirm,
  partnerName,
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;
  const [confirmationText, setConfirmationText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isValid = confirmationText.trim().toLowerCase() === partnerName.trim().toLowerCase();

  const handleConfirm = async () => {
    if (!isValid) return;
    setIsProcessing(true);
    await onConfirm();
    setIsProcessing(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView 
           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
           style={styles.keyboardView}
        >
          <View style={[styles.container, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'white' }]}>
            
            {/* Header */}
            <View style={styles.header}>
               <View style={styles.warningIcon}>
                  <AlertTriangle color="#EF4444" size={24} />
               </View>
               <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                 <X color={colors.muted} size={20} />
               </TouchableOpacity>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>Break Bond?</Text>
            
            <Text style={[styles.description, { color: colors.muted }]}>
              This action ensures you and {partnerName} are no longer connected. 
              <Text style={{fontWeight: 'bold', color: '#EF4444'}}> All shared history, nugs, and dews will be permanently deleted.</Text>
            </Text>

            <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)' }]}>
                <Text style={[styles.label, { color: colors.muted }]}>
                   Type <Text style={{fontWeight: 'bold', color: colors.text}}>{partnerName}</Text> to confirm:
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                  value={confirmationText}
                  onChangeText={setConfirmationText}
                  placeholder={partnerName}
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                />
            </View>

            <View style={styles.actions}>
               <TouchableOpacity 
                 style={styles.cancelButton}
                 onPress={onClose}
                 disabled={isProcessing}
               >
                 <Text style={[styles.cancelText, { color: colors.muted }]}>Cancel</Text>
               </TouchableOpacity>

               <TouchableOpacity 
                 style={[
                    styles.deleteButton, 
                    !isValid && styles.deleteButtonDisabled
                 ]}
                 onPress={handleConfirm}
                 disabled={!isValid || isProcessing}
               >
                 {isProcessing ? (
                    <ActivityIndicator color="white" size="small" />
                 ) : (
                    <Text style={styles.deleteText}>Break Bond</Text>
                 )}
               </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  warningIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Quicksand',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  inputContainer: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Quicksand',
    fontSize: 14,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: 'Quicksand',
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12, // Match input radius
  },
  cancelText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1.5,
    height: 48,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, // Reduced shadow for modern look
    shadowRadius: 8,
    elevation: 4,
  },
  deleteButtonDisabled: {
    backgroundColor: '#ffb3b3', // Lighter red
    shadowOpacity: 0,
    elevation: 0,
  },
  deleteText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
