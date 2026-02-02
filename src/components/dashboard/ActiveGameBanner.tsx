import { GameSession, GameType } from '@/src/services/gameService';
import { colors } from '@/src/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Play } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ActiveGameBannerProps {
  session: GameSession & { game_types: GameType };
}

export const ActiveGameBanner = ({ session }: ActiveGameBannerProps) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  if (!session || !session.is_active) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push(`/games/${session.game_types.slug}` as any)}
      style={styles.container}
    >
      <LinearGradient
        colors={session.game_types.gradient_colors || [colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
            <View style={styles.iconWrapper}>
                <Animated.View 
                    style={[
                        styles.pulseRing, 
                        { 
                            transform: [{ scale: pulseAnim }],
                            opacity: pulseAnim.interpolate({
                                inputRange: [1, 1.2],
                                outputRange: [0.6, 0]
                            })
                        }
                    ]} 
                />
                <View style={styles.iconContainer}>
                    <Play fill="white" color="white" size={14} style={{ marginLeft: 2 }} />
                </View>
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.label}>HAPPENING NOW</Text>
                <Text style={styles.title} numberOfLines={1}>
                    Join {session.game_types.name}
                </Text>
            </View>
        </View>
        <View style={styles.joinBadge}>
            <Text style={styles.joinText}>Join</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden', // Ensure pulse doesn't spill if needed? Actually false if we want pulse outside? 
    // But card is constrained.
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingVertical: 14,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  pulseRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 1,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontFamily: 'Outfit',
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  joinBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  joinText: {
    fontFamily: 'Outfit',
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary, // Or dynamic based on gradient? Primary is safe.
  },
});
