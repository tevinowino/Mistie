import { useTheme } from '@/src/context/ThemeContext';
import { darkColors, lightColors } from '@/src/theme/colors';
import { BlurView } from 'expo-blur';
import { Bell, Flame, User } from 'lucide-react-native';
import React from 'react';
import { Image, ImageSourcePropType, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FloatingHeaderProps {
  avatarSource?: ImageSourcePropType;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  notificationCount?: number;
  streak?: number;
}

export const FloatingHeader: React.FC<FloatingHeaderProps> = ({
  avatarSource,
  onProfilePress,
  onNotificationPress,
  notificationCount = 0,
  streak = 0,
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, styles.blur]} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidBg, isDark && styles.androidBgDark]} />
      )}

      {/* LOGO + STREAK (Left) */}
      <View style={styles.leftSection}>
        <Image 
          source={require('@/src/assets/images/logo-no-bg.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        {streak > 0 && (
          <View style={[styles.streakBadge, isDark && styles.streakBadgeDark]}>
            <Flame color="#FF9800" size={14} fill="#FF9800" />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        )}
      </View>

      {/* ICONS (Right) */}
      <View style={styles.iconGroup}>
        {/* Notification Bell */}
        <TouchableOpacity onPress={onNotificationPress} style={[styles.iconButton, isDark && styles.iconButtonDark]}>
          <Bell color={colors.text} size={20} strokeWidth={2} />
          {notificationCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Profile Avatar */}
        <TouchableOpacity onPress={onProfilePress} style={[styles.avatarButton, { borderColor: colors.primary }]}>
          {avatarSource ? (
            <Image source={avatarSource} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, isDark && styles.avatarPlaceholderDark]}>
              <User color={colors.muted} size={18} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 100,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  blur: {
    borderRadius: 26,
  },
  androidBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 26,
  },
  androidBgDark: {
    backgroundColor: 'rgba(26, 5, 16, 0.92)',
  },
  logoImage: {
    width: 30,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakBadgeDark: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  streakText: {
    fontFamily: 'Outfit',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 75, 125, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDark: {
    backgroundColor: 'rgba(255, 107, 148, 0.15)',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderDark: {
    backgroundColor: '#2D2D2D',
  },
});
