import { MistButton } from '@/src/components/ui/MistButton';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { useAuth } from '@/src/context/AuthContext';
import { bondService } from '@/src/services/bondService';
import { colors } from '@/src/theme/colors';
import { router } from 'expo-router';
import { ArrowLeft, Copy, Heart, QrCode, Share2, Sparkles } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Clipboard, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function LinkScreen() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'join' | 'invite'>('join');
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkBondStatus();

    // Poll if in invite mode to check if someone joined
    const interval = activeTab === 'invite' ? setInterval(checkBondStatus, 3000) : null;
    return () => { if (interval) clearInterval(interval); };
  }, [user, activeTab]);

  // Check current bond status
  const checkBondStatus = async () => {
    if (!user) return;
    const { data } = await bondService.getUserBond(user.id);
    
    if (data) {
        if (data.status === 'couple') {
            router.replace('/(tabs)');
        } else if (data.status === 'pending' && data.user_1_id === user.id) {
            // We already have a pending bond, show its code
            setGeneratedCode(data.connection_code);
        }
    } else {
        // No bond found. If we are in INVITE tab, auto-create one.
        if (activeTab === 'invite') {
            createBondIfNeeded();
        }
    }
  };

  const createBondIfNeeded = async () => {
    if (!user || generatedCode || isLoading) return;
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

  const handleCopy = () => {
    if (generatedCode) {
        Clipboard.setString(generatedCode);
        setIsCopying(true);
        setTimeout(() => setIsCopying(false), 2000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ScreenWrapper variant="dawn">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleSignOut} style={styles.backButton}>
                    <ArrowLeft color={colors.coral} size={24} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Partner Link</Text>
                    <Text style={styles.subtitle}>Connect with your person</Text>
                </View>
            </View>

            {/* TAB SELECTOR */}
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'join' && styles.activeTab]}
                    onPress={() => setActiveTab('join')}
                >
                    <Text style={[styles.tabText, activeTab === 'join' && styles.activeTabText]}>I have a code</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'invite' && styles.activeTab]}
                    onPress={() => setActiveTab('invite')}
                >
                    <Text style={[styles.tabText, activeTab === 'invite' && styles.activeTabText]}>Share my code</Text>
                </TouchableOpacity>
            </View>

            {/* CONTENT AREA */}
            <View style={styles.content}>
                {activeTab === 'join' ? (
                    <View style={styles.card}>
                        <View style={styles.iconHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: '#E0F7FA' }]}>
                                <QrCode color="#00ACC1" size={32} />
                            </View>
                        </View>
                        <Text style={styles.cardTitle}>Enter Invitation Code</Text>
                        <Text style={styles.cardDesc}>Enter the 6-digit code shared by your partner to connect.</Text>
                        
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="000000"
                                placeholderTextColor={colors.muted}
                                keyboardType="number-pad"
                                maxLength={6}
                                value={code}
                                onChangeText={setCode}
                                autoCapitalize="none"
                            />
                        </View>

                        <MistButton 
                            title={isLoading ? "Connecting..." : "Connect Partner"}
                            onPress={handleJoin}
                            isLoading={isLoading}
                        />
                    </View>
                ) : (
                    <View style={styles.card}>
                        <View style={styles.iconHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: '#F3E5F5' }]}>
                                <Sparkles color="#8E24AA" size={32} />
                            </View>
                        </View>
                        <Text style={styles.cardTitle}>Your Invitation Code</Text>
                        <Text style={styles.cardDesc}>Share this code with your partner securely.</Text>

                        {generatedCode ? (
                            <TouchableOpacity 
                                activeOpacity={0.7}
                                onPress={handleCopy}
                                style={styles.codeDisplay}
                            >
                                <Text style={styles.codeText}>{generatedCode}</Text>
                                <View style={styles.copyBadge}>
                                    {isCopying ? (
                                        <Text style={styles.copyText}>Copied!</Text>
                                    ) : (
                                        <Copy color={colors.primary} size={18} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.loadingBox}>
                                <Text style={styles.loadingText}>Generating magic code...</Text>
                            </View>
                        )}

                        <View style={styles.pulseContainer}>
                            <Heart color={colors.coral} size={20} />
                            <Text style={styles.waiting}>Waiting for them to join...</Text>
                        </View>

                        <MistButton 
                            title="Share Code"
                            variant="secondary"
                            onPress={handleCopy}
                            icon={<Share2 size={18} color={colors.primary} />}
                        />
                    </View>
                )}
            </View>

        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 60,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: colors.muted,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'Quicksand',
    fontSize: 15,
    color: colors.muted,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontFamily: 'Outfit',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    alignItems: 'center',
  },
  iconHeader: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'Outfit',
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDesc: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputWrapper: {
    width: '100%',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 60,
    marginBottom: 24,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  input: {
    fontFamily: 'Outfit',
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 8,
    width: '100%',
  },
  codeDisplay: {
    width: '100%',
    backgroundColor: '#FAFAFA',
    paddingVertical: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderStyle: 'dashed',
    position: 'relative',
  },
  codeText: {
    fontFamily: 'Outfit',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 6,
    color: colors.primary,
  },
  copyBadge: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  copyText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  loadingBox: {
    height: 80,
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'Quicksand',
    color: colors.muted,
    fontStyle: 'italic',
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  waiting: {
    fontFamily: 'Quicksand',
    fontSize: 13,
    color: colors.coral,
    fontWeight: '600',
  },
});

