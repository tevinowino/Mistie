import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import React from 'react';
import {
    Dimensions,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    interpolate,
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = 440;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface SwipeableGameCardProps {
  title: string;
  subtitle: string;
  gradientColors: readonly [string, string];
  backgroundImage?: any;
  categoryLabel?: string;
  index?: number;
  scrollX?: SharedValue<number>;
  onPress: () => void;
}

export const SwipeableGameCard: React.FC<SwipeableGameCardProps> = ({
  title,
  subtitle,
  gradientColors,
  backgroundImage,
  categoryLabel,
  index = 0,
  scrollX,
  onPress,
}) => {
  const pressed = useSharedValue(1);

  const handlePressIn = () => {
    pressed.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(1, { damping: 15 });
  };

  // Scale animation on press
  const animatedStyle = useAnimatedStyle(() => {
    // Parallax effect based on scroll position
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = scrollX
      ? interpolate(
          scrollX.value,
          inputRange,
          [0.9, 1, 0.9],
          'clamp'
        )
      : 1;

    const rotate = scrollX
      ? interpolate(
          scrollX.value,
          inputRange,
          [-3, 0, 3],
          'clamp'
        )
      : 0;

    const translateY = scrollX
      ? interpolate(
          scrollX.value,
          inputRange,
          [20, 0, 20],
          'clamp'
        )
      : 0;

    return {
      transform: [
        { scale: scale * pressed.value },
        { rotateZ: `${rotate}deg` },
        { translateY },
      ],
    };
  });

  return (
    <AnimatedTouchable
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedStyle]}
    >
      {backgroundImage ? (
        <ImageBackground
          source={backgroundImage}
          style={styles.imageBackground}
          imageStyle={styles.image}
          resizeMode="cover"
        >
          {/* More translucent gradient - shows more of the image */}
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.1)',
              `${gradientColors[0]}40`, // 25% opacity at top
              `${gradientColors[1]}95`, // 58% opacity at bottom
            ]}
            locations={[0, 0.3, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.overlay}
          >
            <CardContent
              title={title}
              subtitle={subtitle}
              categoryLabel={categoryLabel}
              gradientColors={gradientColors}
            />
          </LinearGradient>
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={[gradientColors[0], gradientColors[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradient}
        >
          <CardContent
            title={title}
            subtitle={subtitle}
            categoryLabel={categoryLabel}
            gradientColors={gradientColors}
          />
        </LinearGradient>
      )}
    </AnimatedTouchable>
  );
};

const CardContent: React.FC<{
  title: string;
  subtitle: string;
  categoryLabel?: string;
  gradientColors: readonly [string, string];
}> = ({ title, subtitle, categoryLabel, gradientColors }) => (
  <View style={styles.content}>
    {/* Top section with category badge */}
    <View style={styles.topSection}>
      {categoryLabel && (
        <View style={[styles.categoryBadge, { backgroundColor: `${gradientColors[0]}90` }]}>
          <Sparkles color="white" size={12} />
          <Text style={styles.categoryText}>{categoryLabel}</Text>
        </View>
      )}
    </View>

    {/* Bottom section with title, subtitle, and button */}
    <View style={styles.bottomSection}>
      {/* Glass card effect for text */}
      <View style={styles.textCard}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={3}>
          {subtitle}
        </Text>

        {/* Play button */}
        <TouchableOpacity style={[styles.playButton, { backgroundColor: gradientColors[0] }]}>
          <Text style={styles.playText}>Play Now</Text>
          <ChevronRight color="white" size={18} />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 32,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'hidden',
  },
  imageBackground: {
    flex: 1,
  },
  image: {
    borderRadius: 32,
  },
  overlay: {
    flex: 1,
    borderRadius: 32,
  },
  gradient: {
    flex: 1,
    borderRadius: 32,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  categoryText: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomSection: {
    marginTop: 'auto',
  },
  textCard: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    // Glassmorphism effect
    backdropFilter: 'blur(10px)',
  },
  title: {
    fontFamily: 'Outfit',
    fontWeight: 'bold',
    fontSize: 28,
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontFamily: 'Quicksand',
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 22,
    marginBottom: 16,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  playText: {
    fontFamily: 'Outfit',
    fontWeight: '700',
    fontSize: 15,
    color: 'white',
  },
});
