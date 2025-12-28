import { HarmonyRing } from '@/src/components/HarmonyRing';
import { FloatingHeader } from '@/src/components/ui/FloatingHeader';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { supabase } from '@/src/lib/supabase';
import { bondService } from '@/src/services/bondService';
import { darkColors, lightColors } from '@/src/theme/colors';
import { differenceInDays, differenceInMonths, differenceInYears, parseISO } from 'date-fns';
import { router, useFocusEffect } from 'expo-router';
import { ArrowRight, Calendar, CalendarHeart, ChevronRight, Droplets, Flame, Heart, MessageCircle, TrendingUp } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Stats {
  streak: number;
  bestStreak: number;
  totalNugs: number;
  nugsFromMe: number;
  nugsFromPartner: number;
  dewsCompleted: number;
  dewsTotal: number;
  bondDays: number;
  anniversaryDate: string | null;
  togetherDays: number | null;
  togetherMonths: number | null;
  togetherYears: number | null;
}

interface ActivityItem {
  title: string;
  date: string;
  icon: any;
  color: string;
}

export default function Pulse() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;
  const [stats, setStats] = useState<Stats>({
    streak: 0,
    bestStreak: 0,
    totalNugs: 0,
    nugsFromMe: 0,
    nugsFromPartner: 0,
    dewsCompleted: 0,
    dewsTotal: 0,
    bondDays: 0,
    anniversaryDate: null,
    togetherDays: null,
    togetherMonths: null,
    togetherYears: null,
  });
  const [partnerName, setPartnerName] = useState('Partner');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadStats();
      }
    }, [user])
  );

  const loadStats = async () => {
    if (!user) return;
    setIsLoading(true);

    // Get bond
    const { data: bond } = await bondService.getUserBond(user.id);
    if (!bond) {
      setIsLoading(false);
      return;
    }

    // Get partner name
    const { data: partnerProfile } = await bondService.getPartnerProfile(bond, user.id);
    if (partnerProfile?.display_name) {
      setPartnerName(partnerProfile.display_name);
    }

    // Calculate bond days
    const bondCreated = new Date(bond.created_at);
    const today = new Date();
    const bondDays = Math.floor((today.getTime() - bondCreated.getTime()) / (1000 * 60 * 60 * 24));

    // Get nugs stats
    const { data: nugs } = await supabase
      .from('nugs')
      .select('*')
      .eq('bond_id', bond.id);

    const totalNugs = nugs?.length || 0;
    const nugsFromMe = nugs?.filter(n => n.sender_id === user.id).length || 0;
    const nugsFromPartner = totalNugs - nugsFromMe;

    // Get dews stats
    const { data: dews } = await supabase
      .from('daily_dews')
      .select('*')
      .eq('bond_id', bond.id);

    const dewsTotal = dews?.length || 0;
    const dewsCompleted = dews?.filter(d => d.is_revealed).length || 0;

    // Build activity feed from real data
    const activityItems: ActivityItem[] = [];

    // Add recent nugs to activity
    if (nugs && nugs.length > 0) {
      const recentNugs = nugs.slice(0, 3);
      recentNugs.forEach(nug => {
        const isFromMe = nug.sender_id === user.id;
        activityItems.push({
          title: isFromMe 
            ? `You sent a ${nug.type === 'note' ? 'note' : 'nug'} to ${partnerProfile?.display_name || 'Partner'}`
            : `${partnerProfile?.display_name || 'Partner'} sent you a ${nug.type === 'note' ? 'note' : 'nug'}`,
          date: formatDate(nug.created_at),
          icon: nug.type === 'note' ? MessageCircle : Heart,
          color: colors.primary,
        });
      });
    }

    // Add recent dews to activity
    if (dews && dews.length > 0) {
      const recentDews = dews.filter(d => d.is_revealed).slice(0, 2);
      recentDews.forEach(dew => {
        activityItems.push({
          title: 'Daily Dew Complete',
          date: formatDate(dew.scheduled_for),
          icon: Droplets,
          color: '#4CAF50',
        });
      });
    }

    // Sort by date (most recent first) and limit
    setActivities(activityItems.slice(0, 5));

    // Calculate "Together For" from anniversary_date
    let togetherYears = null;
    let togetherMonths = null;
    let togetherDays = null;
    
    if (bond.anniversary_date) {
      const startDate = parseISO(bond.anniversary_date);
      const now = new Date();
      togetherYears = differenceInYears(now, startDate);
      togetherMonths = differenceInMonths(now, startDate) % 12;
      // Calculate remaining days
      const tempDate = new Date(startDate);
      tempDate.setFullYear(tempDate.getFullYear() + togetherYears);
      tempDate.setMonth(tempDate.getMonth() + togetherMonths);
      togetherDays = differenceInDays(now, tempDate);
    }

    setStats({
      streak: bond.streak_count || 0,
      bestStreak: bond.best_streak || 0,
      totalNugs,
      nugsFromMe,
      nugsFromPartner,
      dewsCompleted,
      dewsTotal,
      bondDays,
      anniversaryDate: bond.anniversary_date || null,
      togetherYears,
      togetherMonths,
      togetherDays,
    });

    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Calculate harmony score (0-100)
  const calculateHarmony = () => {
    // Removed bondDays check to match Home Screen logic
    const streakScore = Math.min(stats.streak * 5, 30); // Max 30 points
    const dewScore = stats.dewsTotal > 0 ? (stats.dewsCompleted / stats.dewsTotal) * 40 : 20; // Max 40 points
    const nugScore = Math.min(stats.totalNugs * 2, 30); // Max 30 points
    
    return Math.min(Math.round(streakScore + dewScore + nugScore), 100);
  };

  const harmony = calculateHarmony();
  const harmonyLabel = harmony >= 80 ? 'Thriving' : harmony >= 60 ? 'Growing' : harmony >= 40 ? 'Budding' : 'New';

  return (
    <ScreenWrapper variant="dawn" noPadding>
      <FloatingHeader 
        onProfilePress={() => router.push('/profile')}
        onNotificationPress={() => console.log('Notifications')}
        streak={stats.streak}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Pulse</Text>
          <Text style={[styles.pageSubtitle, { color: colors.muted }]}>Your bond vitality</Text>
          
          <View style={styles.ringContainer}>
            {/* Increased size and used transparent variant */}
            <HarmonyRing score={harmony} size="large" showLabel={false} />
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statusText, { color: colors.text }]}>{harmonyLabel}</Text>
            </View>
          </View>
        </View>

        {/* BENTO GRID */}
        <View style={styles.inputContainer}>
          {/* Top Row */}
          <View style={styles.gridRow}>
            {/* LARGE: Current Streak */}
            <View style={[styles.glassCard, styles.largeCard, { 
              backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)', 
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'white' 
            }]}>
              <View style={styles.cardHeader}>
                <Flame color="#FF9800" size={28} fill={isDark ? '#FF9800' : 'transparent'} />
                <Text style={[styles.cardLabel, { color: colors.muted }]}>Streak</Text>
              </View>
              <View style={styles.centerContent}>
                <Text style={[styles.giantNumber, { color: colors.text }]}>{stats.streak}</Text>
                <Text style={[styles.unitText, { color: colors.muted }]}>DAYS</Text>
              </View>
              <Text style={[styles.subText, { color: colors.muted, bottom: 12, right: 16 }]}>Best: {stats.bestStreak}</Text>
            </View>

            {/* Right Column Stack */}
            <View style={styles.gridColumn}>
              {/* Bond Days (App Usage) - Restored */}
              <View style={[styles.glassCard, styles.smallCard, { 
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)', 
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'white' 
              }]}>
                <View style={styles.smallCardHeader}>
                  <Calendar color={colors.primary} size={18} />
                  <Text style={[styles.miniLabel, { color: colors.muted }]}>Bonded</Text>
                </View>
                <Text style={[styles.mediumNumber, { color: colors.text }]}>{stats.bondDays}</Text>
                <Text style={[styles.unitTextSmall, { color: colors.muted }]}>days</Text>
              </View>

              {/* Nugs Sent */}
              <TouchableOpacity 
                onPress={() => router.push('/nugs-history')}
                style={[styles.glassCard, styles.smallCard, { 
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)', 
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'white' 
              }]}>
                <View style={styles.smallCardHeader}>
                  <Heart color={colors.secondary} size={18} fill={colors.secondary} />
                  <Text style={[styles.miniLabel, { color: colors.muted }]}>Nugs</Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 4}}>
                  <Text style={[styles.mediumNumber, { color: colors.text }]}>{stats.totalNugs}</Text>
                  <ArrowRight color={colors.muted} size={14} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* TOGETHER FOR - Wide Card */}
          {stats.anniversaryDate && (
             <View style={[styles.glassCard, styles.wideCard, { 
              backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)', 
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'white' 
            }]}>
              <View style={styles.wideCardContent}>
                 <View style={styles.metricInfo}>
                   <View style={styles.smallCardHeader}>
                     <CalendarHeart color={colors.primary} size={20} />
                     <Text style={[styles.cardLabel, { color: colors.muted, marginBottom: 0 }]}>Together For</Text>
                   </View>
                   <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 12, marginTop: 8}}>
                      {stats.togetherYears !== null && stats.togetherYears > 0 && (
                        <View style={{alignItems: 'center'}}>
                          <Text style={[styles.mediumNumber, { color: colors.text, fontSize: 24 }]}>{stats.togetherYears}</Text>
                          <Text style={[styles.unitTextSmall, { color: colors.muted }]}>YEARS</Text>
                        </View>
                      )}
                      
                      <View style={{alignItems: 'center'}}>
                        <Text style={[styles.mediumNumber, { color: colors.text, fontSize: 24 }]}>{stats.togetherMonths}</Text>
                        <Text style={[styles.unitTextSmall, { color: colors.muted }]}>MONTHS</Text>
                      </View>
                      
                      <View style={{alignItems: 'center'}}>
                        <Text style={[styles.mediumNumber, { color: colors.text, fontSize: 24 }]}>{stats.togetherDays}</Text>
                        <Text style={[styles.unitTextSmall, { color: colors.muted }]}>DAYS</Text>
                      </View>
                   </View>
                 </View>
              </View>
            </View>
          )}

          {/* Bottom Row - Completion */}
          <View style={[styles.glassCard, styles.wideCard, { 
            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)', 
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'white' 
          }]}>
            <View style={styles.wideCardContent}>
               <View style={styles.metricInfo}>
                 <Text style={[styles.metricLabel, { color: colors.muted, marginBottom: 4 }]}>Dew Completion</Text>
                 <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 4}}>
                    <Text style={[styles.metricValue, { color: colors.text, fontSize: 24 }]}>
                      {stats.dewsTotal > 0 ? Math.round((stats.dewsCompleted / stats.dewsTotal) * 100) : 0}%
                    </Text>
                    <Text style={[styles.unitTextSmall, { color: colors.muted }]}>of total drops</Text>
                 </View>
               </View>
               <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E3F2FD' }]}>
                 <Droplets color={colors.accentBlue || '#64B5F6'} size={24} />
               </View>
            </View>
          </View>
        </View>

        {/* NUG FLOW */}
        <TouchableOpacity 
          style={[styles.glassCard, styles.flowCard, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'white' }]}
          onPress={() => router.push('/nugs-history')}
        >
          <View style={styles.flowHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Exchange Flow</Text>
            <ChevronRight color={colors.muted} size={16} />
          </View>
          
          <View style={styles.flowBarContainer}>
            <View style={styles.flowBar}>
               <View style={[styles.flowFill, { flex: stats.nugsFromMe || 1, backgroundColor: colors.primary }]} />
               <View style={[styles.flowFill, { flex: stats.nugsFromPartner || 1, backgroundColor: colors.secondary }]} />
            </View>
            <View style={styles.flowLabels}>
               <Text style={[styles.flowText, { color: colors.primary }]}>You ({stats.nugsFromMe})</Text>
               <Text style={[styles.flowText, { color: colors.secondary }]}>{partnerName} ({stats.nugsFromPartner})</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* TIMELINE */}
        <View style={styles.timelineSection}>
          <View style={styles.sectionHeader}>
             <TrendingUp color={colors.text} size={18} />
             <Text style={[styles.sectionTitle, { color: colors.text }]}>Timeline</Text>
          </View>

          <View style={styles.timelineList}>
            {/* Vertical Line */}
            <View style={[styles.timelineLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />

            {activities.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.muted }]}>No recent activity</Text>
            ) : (
              activities.map((item, i) => (
                <View key={i} style={styles.timelineItem}>
                   <View style={[styles.timelineDot, { backgroundColor: colors.card, borderColor: item.color }]}>
                      <item.icon color={item.color} size={14} />
                   </View>
                   <View style={styles.timelineContent}>
                      <Text style={[styles.timelineDate, { color: colors.muted }]}>{item.date}</Text>
                      <Text style={[styles.timelineTitle, { color: colors.text }]}>{item.title}</Text>
                   </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 120, // Space for FloatingHeader
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  pageTitle: {
    fontFamily: 'Outfit',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: 'Quicksand',
    fontSize: 16,
    marginBottom: 24,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 180, // Ensure space for ring
  },
  statusBadge: {
    position: 'absolute',
    bottom: -10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 8, 140, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: 'Outfit',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  
  // GRID & LAYOUT
  inputContainer: {
    marginBottom: 24,
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridColumn: {
    flex: 1,
    gap: 12,
  },
  glassCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  
  // CARDS
  largeCard: {
    flex: 1,
    aspectRatio: 0.85, // Taller than wide
    padding: 24,
    justifyContent: 'space-between',
    minHeight: 200,
  },
  smallCard: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 8,
    minHeight: 94,
  },
  wideCard: {
    padding: 20,
    width: '100%',
  },
  wideCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // CONTENT STYLES
  cardHeader: {
    alignItems: 'flex-start',
    gap: 8,
  },
  smallCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardLabel: {
    fontFamily: 'Quicksand',
    fontSize: 16,
    fontWeight: '600',
  },
  miniLabel: {
    fontFamily: 'Quicksand',
    fontSize: 13,
    fontWeight: '600',
  },
  
  // NUMBERS & TEXT
  centerContent: {
    alignItems: 'flex-start'
  },
  giantNumber: {
    fontFamily: 'Outfit',
    fontSize: 48,
    fontWeight: 'bold',
    lineHeight: 56,
  },
  mediumNumber: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: 'bold',
  },
  unitText: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    letterSpacing: 2,
    marginTop: -4,
    textTransform: 'uppercase',
  },
  unitTextSmall: {
    fontFamily: 'Quicksand',
    fontSize: 12,
  },
  subText: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    position: 'absolute',
  },
  
  // ICON CIRCLE
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // METRICS (Legacy styles kept if needed, but mostly replaced)
  metricInfo: {
    flex: 1,
  },
  metricValue: {
    fontFamily: 'Outfit',
    fontSize: 20,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontFamily: 'Quicksand',
    fontSize: 13,
  },
  
  // FLOW
  flowCard: {
    marginBottom: 32,
    padding: 20,
  },
  flowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '600',
  },
  flowBarContainer: {
    gap: 8,
  },
  flowBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  flowFill: {
    height: '100%',
  },
  flowLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flowText: {
    fontFamily: 'Quicksand',
    fontSize: 11,
    fontWeight: '600',
  },
  
  // TIMELINE
  timelineSection: {
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timelineList: {
    position: 'relative',
    paddingLeft: 12,
  },
  timelineLine: {
    position: 'absolute',
    left: 23, // Center of dot (12 + 22/2)
    top: 10,
    bottom: 0,
    width: 2,
    borderRadius: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
    position: 'relative',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginRight: 16,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineDate: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    marginBottom: 2,
  },
  timelineTitle: {
    fontFamily: 'Outfit',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  emptyText: {
    fontFamily: 'Quicksand',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});
