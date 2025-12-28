import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Lock } from 'lucide-react-native';
import React, { ReactNode } from 'react';
import {
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface GameCardProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  gradientColors: readonly [string, string, ...string[]];
  backgroundImage?: any;
  onPress: () => void;
  isLocked?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({ 
  title, 
  subtitle, 
  icon, 
  gradientColors,
  backgroundImage,
  onPress,
  isLocked = false
}) => {
  const pressed = useSharedValue(1);

  const handlePressIn = () => {
    if (isLocked) return;
    pressed.value = withSpring(0.97, { damping: 15 });
  };

  const handlePressOut = () => {
    if (isLocked) return;
    pressed.value = withSpring(1, { damping: 15 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  const CardContent = (
    <View style={styles.content}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
      </View>
      <View style={styles.arrowContainer}>
        {isLocked ? (
           <Lock color="rgba(255,255,255,0.6)" size={20} />
        ) : (
           <ChevronRight color="rgba(255,255,255,0.9)" size={24} />
        )}
      </View>
    </View>
  );

  return (
    <AnimatedTouchable 
      activeOpacity={isLocked ? 1 : 0.7} 
      onPress={isLocked ? undefined : onPress}
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
              `${gradientColors[0]}70`, // 44% opacity
              `${gradientColors[1]}B0`, // 69% opacity
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          >
            {isLocked && <View style={styles.lockedOverlay} />}
            {CardContent}
          </LinearGradient>
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        >
          {isLocked && <View style={styles.lockedOverlay} />}
          {CardContent}
        </LinearGradient>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 115,
    borderRadius: 24,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  imageBackground: {
    flex: 1,
  },
  image: {
    borderRadius: 24,
  },
  gradient: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontFamily: 'Outfit',
    fontWeight: 'bold',
    fontSize: 18,
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontFamily: 'Quicksand',
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
});
