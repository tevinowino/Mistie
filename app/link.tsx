import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { useAuth } from '@/src/context/AuthContext';
import { useNetwork } from '@/src/context/NetworkContext';
import { useTheme } from '@/src/context/ThemeContext';
import { bondService } from '@/src/services/bondService';
import { darkColors, lightColors } from '@/src/theme/colors';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import {
    ArrowRight,
    ChevronLeft,
    Copy,
    Hash,
    HeartHandshake,
    Users,
    WifiOff,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LinkScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { isConnected } = useNetwork();
  const colors = isDark ? darkColors : lightColors;
  
  const [activeTab, setActiveTab] = useState<'join' | 'invite'>('join');
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'invite' && isConnected) {
      createBondIfNeeded();
    }
  }, [activeTab, isConnected]);

  const createBondIfNeeded = async () => {
    if (!user || generatedCode || isLoading || !isConnected) return;
    setIsLoading(true);
    const { data, error } = await bondService.createPendingBond(user.id);
    setIsLoading(false);

    if (error) {
       console.error(error);
       // Don't alert immediately on auto-create to avoid spam, just log
    } else if (data) {
       setGeneratedCode(data.connection_code);
    }
  };

  const handleJoin = async () => {
    if (!isConnected) {
        Alert.alert("Offline", "Please check your internet connection.");
        return;
    }
    if (!user || !code || code.length !== 6) {
        Alert.alert("Invalid Code", "Please enter a valid 6-digit code.");
        return;
    }
    
    setIsLoading(true);
    const { data, error } = await bondService.joinBond(user.id, code);
    setIsLoading(false);

    if (error) {
        Alert.alert('Connection Failed', (error as any).message || "Invalid code or bond expired.");
    } else if (data) {
        Alert.alert('Connected!', "Your journey begins now.", [
            { text: "Enter Mistie", onPress: () => router.replace('/(tabs)') }
        ]);
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(generatedCode);
    Alert.alert('Copied!', 'Code copied to clipboard.');
  };

  return (
    <ScreenWrapper variant="dawn" noPadding>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white' }]}
          onPress={() => router.back()}
        >
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Link Partner</Text>
        <View style={{ width: 44 }} />
      </View>

      {!isConnected && (
         <View style={[styles.offlineBanner, { backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2' }]}>
             <WifiOff size={16} color={isDark ? '#FCA5A5' : '#EF4444'} />
             <Text style={[styles.offlineText, { color: isDark ? '#FECACA' : '#991B1B' }]}>
                 You are offline. Reconnect to link with your partner.
             </Text>
         </View>
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          
          {/* TABS */}
          <View style={[styles.tabContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }]}>
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'join' && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white' }
              ]}
              onPress={() => setActiveTab('join')}
              disabled={!isConnected}
            >
              <Users color={activeTab === 'join' ? colors.primary : colors.muted} size={18} />
              <Text style={[styles.tabText, { color: activeTab === 'join' ? colors.text : colors.muted }]}>
                Join Bond
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'invite' && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white' }
              ]}
              onPress={() => setActiveTab('invite')}
              disabled={!isConnected}
            >
              <HeartHandshake color={activeTab === 'invite' ? colors.primary : colors.muted} size={18} />
              <Text style={[styles.tabText, { color: activeTab === 'invite' ? colors.text : colors.muted }]}>
                Invite Partner
              </Text>
            </TouchableOpacity>
          </View>

          {/* MAIN CONTENT AREA */}
          <View style={[styles.card, { backgroundColor: isDark ? 'rgba(30,41,59,0.5)' : 'white' }]}>
            {activeTab === 'join' ? (
              <View style={styles.formSection}>
                 <Text style={[styles.sectionTitle, { color: colors.text }]}>Enter Code</Text>
                 <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
                   Enter the 6-digit code shared by your partner to connect.
                 </Text>
                 
                 <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F5F7FA' }]}>
                   <Hash color={colors.muted} size={20} />
                   <TextInput
                     style={[styles.input, { color: colors.text }]}
                     placeholder="Ex: 8X29B1"
                     placeholderTextColor={colors.muted}
                     value={code}
                     onChangeText={(text) => setCode(text.toUpperCase())}
                     maxLength={6}
                     autoCapitalize="characters"
                     editable={isConnected}
                   />
                 </View>
                 
                 {!isConnected && (
                     <Text style={{color: '#EF4444', fontFamily: 'Quicksand', fontSize: 13}}>
                         Reconnect to enter a code.
                     </Text>
                 )}

                 <TouchableOpacity
                   style={[styles.actionButton, { backgroundColor: colors.primary, opacity: isConnected ? 1 : 0.6 }]}
                   onPress={handleJoin}
                   disabled={isLoading || !isConnected}
                 >
                   {isLoading ? (
                     <ActivityIndicator color="white" />
                   ) : (
                     <>
                       <Text style={styles.buttonText}>Connect</Text>
                       <ArrowRight color="white" size={20} />
                     </>
                   )}
                 </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formSection}>
                 <Text style={[styles.sectionTitle, { color: colors.text }]}>Share Code</Text>
                 <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
                   Share this unique code with your partner so they can join.
                 </Text>

                 {isLoading ? (
                   <View style={styles.loadingBox}>
                     <ActivityIndicator color={colors.primary} />
                     <Text style={[styles.loadingText, { color: colors.muted }]}>Generating code...</Text>
                   </View>
                 ) : (
                   <View style={[styles.codeDisplay, { borderColor: colors.primary }]}>
                     <Text style={[styles.codeText, { color: colors.primary }]}>
                       {generatedCode || '------'}
                     </Text>
                     <TouchableOpacity 
                         style={[styles.copyIcon, !isConnected && { opacity: 0.5 }]}
                         onPress={copyToClipboard}
                         disabled={!generatedCode || !isConnected} 
                      >
                       <Copy color={colors.primary} size={20} />
                     </TouchableOpacity>
                   </View>
                 )}
                 
                 <Text style={[styles.hint, { color: colors.muted }]}>
                    This code expires in 24 hours.
                 </Text>
              </View>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 20,
    fontWeight: 'bold',
  },
  offlineBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginHorizontal: 20,
      marginBottom: 0,
      gap: 8,
      borderRadius: 12,
  },
  offlineText: {
      fontFamily: 'Quicksand',
      fontSize: 13,
      fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    marginBottom: 24,
    marginTop: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  tabText: {
    fontFamily: 'Outfit',
    fontSize: 14,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  formSection: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'Outfit',
    fontSize: 22,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontFamily: 'Quicksand',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 56,
    gap: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Outfit',
    fontSize: 18,
    letterSpacing: 1,
  },
  actionButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#FF4B7D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  // Invite Tab Styles
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 64,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 75, 125, 0.05)',
  },
  codeText: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  copyIcon: {
    padding: 8,
  },
  loadingBox: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: 'Quicksand',
    fontSize: 14,
  },
  hint: {
    fontFamily: 'Quicksand',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});
