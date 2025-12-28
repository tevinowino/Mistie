import { GameCard } from '@/src/components/dashboard/GameCard';
import { SwipeableGameCard } from '@/src/components/games/SwipeableGameCard';
import { FloatingHeader } from '@/src/components/ui/FloatingHeader';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { bondService } from '@/src/services/bondService';
import { darkColors, lightColors, lightColors as staticColors } from '@/src/theme/colors';
import { calculateMinCoupleAge } from '@/src/utils/ageUtils';
import { GAMES_METADATA, getGameBackgroundImage, getGamesByCategory } from '@/src/utils/gameImages';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import {
    ArrowLeftRight,
    Camera,
    Compass,
    Eye,
    Flame,
    Grid3X3,
    Heart,
    HelpCircle,
    Layers,
    Link,
    MessageCircle,
    Moon,
    Shuffle,
    Sparkles,
    Star,
    Users,
    Zap,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    interpolate,
    SharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animated page indicator component
const PageIndicator = ({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1.3, 0.8],
      'clamp'
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      'clamp'
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return <Animated.View style={[styles.indicator, animatedStyle]} />;
};

// Icon mapping for games
const GAME_ICONS: Record<string, React.ReactNode> = {
  'crush': <Heart color="white" size={28} />,
  'deep-night': <Moon color="white" size={28} />,
  'is-it-okay': <HelpCircle color="white" size={28} />,
  'connected': <Link color="white" size={28} />,
  'whos-more-likely': <Users color="white" size={28} />,
  'memory-lane': <Camera color="white" size={28} />,
  'mirror': <Eye color="white" size={28} />,
  'would-you-rather': <ArrowLeftRight color="white" size={28} />,
  'between-us': <Shuffle color="white" size={28} />,
  'tell-me-everything': <MessageCircle color="white" size={28} />,
  'would-you-rather-hot': <Flame color="white" size={28} />,
  'intimacy': <Sparkles color="white" size={28} />,
  'hard-dare': <Zap color="white" size={28} />,
};

// Category labels for swipe mode
const CATEGORY_LABELS: Record<string, string> = {
  'discovery': 'Discovery',
  'couple': 'As a Couple',
  'date-night': 'Date Night',
  'intimacy': 'Little Spice 🔥',
};

type ViewMode = 'grid' | 'swipe';

export default function GamesScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;
  const [streak, setStreak] = useState(0);
  const [minAge, setMinAge] = useState<number>(18);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const scrollX = useSharedValue(0);

  // Animated scroll handler for smooth parallax
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadStreak();
      }
    }, [user])
  );

  const loadStreak = async () => {
    if (!user) return;
    const { data } = await bondService.getUserBond(user.id);
    if (data) {
      setStreak(data.streak_count || 0);
      
      // Calculate min age from bond profiles
      const age = calculateMinCoupleAge(
        data.user_1_profile?.birth_date,
        data.user_2_profile?.birth_date
      );
      setMinAge(age);
    }
  };

  const navigateToGame = (slug: string, locked: boolean = false) => {
    if (locked) return;
    router.push(`/games/${slug}` as any);
  };

  const toggleViewMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(viewMode === 'grid' ? 'swipe' : 'grid');
  };

  // Get games organized by category for grid view
  const discoveryGames = getGamesByCategory('discovery');
  const coupleGames = getGamesByCategory('couple');
  const dateNightGames = getGamesByCategory('date-night');
  const intimacyGames = getGamesByCategory('intimacy');

  // All games for swipe view
  const allGames = GAMES_METADATA;
  const isCoupleUnderage = minAge < 18;

  const renderSwipeCard = ({ item }: { item: typeof allGames[0] }) => {
    const isLocked = isCoupleUnderage && item.category === 'intimacy';
    return (
      <SwipeableGameCard
        title={item.title}
        subtitle={item.subtitle}
        gradientColors={item.gradientColors}
        backgroundImage={getGameBackgroundImage(item.slug)}
        categoryLabel={CATEGORY_LABELS[item.category]}
        onPress={() => navigateToGame(item.slug, isLocked)}
      />
    );
  };

  return (
    <ScreenWrapper variant="dawn" noPadding>
      <FloatingHeader 
        onProfilePress={() => router.push('/profile')}
        onNotificationPress={() => console.log('Notifications')}
        streak={streak}
      />

      {/* View Toggle - Fixed below header */}
      <View style={styles.toggleContainer}>
        <View style={styles.toggleWrapper}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'swipe' && styles.toggleButtonActive]}
            onPress={() => viewMode !== 'swipe' && toggleViewMode()}
          >
            <Layers color={viewMode === 'swipe' ? 'white' : colors.muted} size={18} />
            <Text style={[styles.toggleText, viewMode === 'swipe' && styles.toggleTextActive]}>
              Discover
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'grid' && styles.toggleButtonActive]}
            onPress={() => viewMode !== 'grid' && toggleViewMode()}
          >
            <Grid3X3 color={viewMode === 'grid' ? 'white' : colors.muted} size={18} />
            <Text style={[styles.toggleText, viewMode === 'grid' && styles.toggleTextActive]}>
              Browse
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'swipe' ? (
        // SWIPE MODE
        <View style={styles.swipeContainer}>
          <View style={styles.swipeHeader}>
            <Text style={[styles.swipeTitle, { color: colors.text }]}>Discover Games</Text>
            <Text style={[styles.swipeSubtitle, { color: colors.muted }]}>Swipe to explore all games</Text>
          </View>

          <Animated.FlatList
            data={allGames}
            renderItem={({ item, index }) => (
              <SwipeableGameCard
                title={item.title}
                subtitle={item.subtitle}
                gradientColors={item.gradientColors}
                backgroundImage={getGameBackgroundImage(item.slug)}
                categoryLabel={CATEGORY_LABELS[item.category]}
                index={index}
                scrollX={scrollX}
                onPress={() => navigateToGame(item.slug, isCoupleUnderage && item.category === 'intimacy')}
              />
            )}
            keyExtractor={(item) => item.slug}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={SCREEN_WIDTH}
            decelerationRate="fast"
            contentContainerStyle={styles.swipeList}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          />

          {/* Page indicators */}
          <View style={styles.indicators}>
            {allGames.map((_, index) => (
              <PageIndicator key={index} index={index} scrollX={scrollX} />
            ))}
          </View>
        </View>
      ) : (
        // GRID MODE
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Games</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Play and connect together</Text>
          </View>

          {/* DISCOVERY SECTION */}
          <View style={styles.sectionHeader}>
            <Compass color="#7C4DFF" size={18} />
            <Text style={styles.sectionTitle}>Discovery</Text>
          </View>
          <Text style={styles.sectionSubtitle}>New explorations and late-night vibes</Text>
          
          {discoveryGames.map((game) => (
            <GameCard
              key={game.slug}
              title={game.title}
              subtitle={game.subtitle}
              icon={GAME_ICONS[game.slug]}
              gradientColors={game.gradientColors}
              backgroundImage={getGameBackgroundImage(game.slug)}
              onPress={() => navigateToGame(game.slug)}
            />
          ))}

          {/* AS A COUPLE SECTION */}
          <View style={styles.sectionHeader}>
            <Heart color="#FF4081" size={18} />
            <Text style={styles.sectionTitle}>As a Couple</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Strengthening your bond and shared history</Text>

          {coupleGames.map((game) => (
            <GameCard
              key={game.slug}
              title={game.title}
              subtitle={game.subtitle}
              icon={GAME_ICONS[game.slug]}
              gradientColors={game.gradientColors}
              backgroundImage={getGameBackgroundImage(game.slug)}
              onPress={() => navigateToGame(game.slug)}
            />
          ))}

          {/* DATE NIGHT SECTION */}
          <View style={styles.sectionHeader}>
            <Star color="#FF6D00" size={18} />
            <Text style={styles.sectionTitle}>Date Night</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Pure entertainment and engaging choices</Text>

          {dateNightGames.map((game) => (
            <GameCard
              key={game.slug}
              title={game.title}
              subtitle={game.subtitle}
              icon={GAME_ICONS[game.slug]}
              gradientColors={game.gradientColors}
              backgroundImage={getGameBackgroundImage(game.slug)}
              onPress={() => navigateToGame(game.slug)}
            />
          ))}

          {/* LITTLE SPICE SECTION (18+) */}
          <View style={styles.sectionHeader}>
            <Flame color="#D50000" size={18} />
            <Text style={styles.sectionTitle}>Little Spice</Text>
            <View style={styles.adultBadge}>
              <Text style={styles.adultBadgeText}>18+</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>Bold, unfiltered intimacy for adventurous couples</Text>

          {intimacyGames.map((game) => (
            <GameCard
              key={game.slug}
              title={game.title}
              subtitle={game.subtitle}
              icon={GAME_ICONS[game.slug]}
              gradientColors={game.gradientColors}
              backgroundImage={getGameBackgroundImage(game.slug)}
              onPress={() => navigateToGame(game.slug, isCoupleUnderage)}
              isLocked={isCoupleUnderage}
            />
          ))}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 25,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: staticColors.primary,
  },
  toggleText: {
    fontFamily: 'Outfit',
    fontSize: 14,
    fontWeight: '600',
    color: staticColors.muted,
  },
  toggleTextActive: {
    color: 'white',
  },
  // Swipe mode styles
  swipeContainer: {
    flex: 1,
    paddingTop: 150,
  },
  swipeHeader: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  swipeTitle: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: 'bold',
    color: staticColors.text,
    marginBottom: 4,
  },
  swipeSubtitle: {
    fontFamily: 'Quicksand',
    fontSize: 15,
    color: staticColors.muted,
  },
  swipeList: {
    alignItems: 'center',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: staticColors.primary,
  },
  // Grid mode styles
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 160,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: 'bold',
    color: staticColors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Quicksand',
    fontSize: 15,
    color: staticColors.muted,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '700',
    color: staticColors.text,
  },
  sectionSubtitle: {
    fontFamily: 'Quicksand',
    fontSize: 13,
    color: staticColors.muted,
    marginBottom: 14,
  },
  adultBadge: {
    backgroundColor: '#D50000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  adultBadgeText: {
    fontFamily: 'Outfit',
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
});
