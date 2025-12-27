import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { supabase } from '@/src/lib/supabase';
import { bondService } from '@/src/services/bondService';
import { colors } from '@/src/theme/colors';
import { BlurView } from 'expo-blur';
import { router, useFocusEffect } from 'expo-router';
import { ArrowUpRight, Heart, MessageCircle } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Nug {
  id: number;
  bond_id: string;
  sender_id: string;
  type: 'silent' | 'note';
  content: string | null;
  created_at: string;
}

export default function NugsHistory() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [nugs, setNugs] = useState<Nug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bond, setBond] = useState<any>(null);
  const [partnerName, setPartnerName] = useState('Partner');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);

    // Get bond
    const { data: bondData } = await bondService.getUserBond(user.id);
    setBond(bondData);

    if (bondData) {
      // Get partner name
      const { data: partnerProfile } = await bondService.getPartnerProfile(bondData, user.id);
      if (partnerProfile?.display_name) {
        setPartnerName(partnerProfile.display_name);
      }

      // Get all nugs
      const { data: nugsData } = await supabase
        .from('nugs')
        .select('*')
        .eq('bond_id', bondData.id)
        .order('created_at', { ascending: false });

      setNugs(nugsData || []);
    }

    setIsLoading(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNug = ({ item, index }: { item: Nug; index: number }) => {
    const isFromMe = item.sender_id === user?.id;
    const senderLabel = isFromMe ? 'You' : partnerName;
    const isNote = item.type === 'note';

    return (
      <View style={[styles.glassCard, styles.nugCard, { 
        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'white'
      }]}>
        <View style={styles.nugHeader}>
          <View style={[styles.nugIconContainer, { backgroundColor: isNote ? '#E3F2FD' : '#FFE4EC' }]}>
            {isNote ? (
              <MessageCircle color={colors.secondary} size={18} />
            ) : (
              <Heart color={colors.primary} size={18} fill={colors.primary} />
            )}
          </View>
          <View style={styles.nugMeta}>
            <View style={styles.row}>
              <Text style={[styles.nugSender, { color: colors.text }]}>{senderLabel}</Text>
              {!isFromMe && <View style={styles.dot} />}
            </View>
            <Text style={[styles.nugTime, { color: colors.muted }]}>{formatTime(item.created_at)}</Text>
          </View>
          
          {isFromMe ? (
            <ArrowUpRight color={colors.muted} size={16} />
          ) : (
            <View style={[styles.receivedBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.receivedText}>RECEIVED</Text>
            </View>
          )}
        </View>
        
        {isNote && item.content && (
          <View style={styles.noteContainer}>
            <Text style={[styles.nugContent, { color: colors.text }]}>"{item.content}"</Text>
          </View>
        )}
        
        {item.type === 'silent' && (
          <Text style={[styles.nugSilentText, { color: colors.muted }]}>
            {isFromMe ? 'Sent a generic nug 💗' : `${partnerName} sent you some love 💗`}
          </Text>
        )}
      </View>
    );
  };

  const sentCount = nugs.filter(n => n.sender_id === user?.id).length;
  const receivedCount = nugs.length - sentCount;

  return (
    <ScreenWrapper variant="dawn">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nug History</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats Glass Panel */}
        <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.statsGlass}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{nugs.length}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total Nugs</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{sentCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Sent</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{receivedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Received</Text>
          </View>
        </BlurView>

        {/* List */}
        {nugs.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart color={colors.muted} size={48} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No nugs yet</Text>
            <Text style={[styles.emptyHint, { color: colors.muted }]}>Send your first nug from the home screen!</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {nugs.map((item, index) => (
              <View key={item.id}>
                {renderNug({ item, index })}
              </View>
            ))}
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

// Need to import Ionicons or just use Lucide arrow
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontFamily: 'Outfit',
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  statsGlass: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontFamily: 'Quicksand',
    fontSize: 13,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  list: {
    paddingBottom: 40,
  },
  glassCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  nugCard: {
    padding: 20,
    marginBottom: 12,
  },
  nugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nugIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nugMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  nugSender: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '600',
  },
  nugTime: {
    fontFamily: 'Quicksand',
    fontSize: 13,
    marginTop: 2,
  },
  receivedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  receivedText: {
    fontFamily: 'Outfit',
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.5,
  },
  noteContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  nugContent: {
    fontFamily: 'DancingScript',
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
  nugSilentText: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    marginTop: 12,
    fontStyle: 'italic',
    paddingLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyHint: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    marginTop: 8,
  },
});
