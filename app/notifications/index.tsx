import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { supabase } from '@/src/lib/supabase';
import { darkColors, lightColors } from '@/src/theme/colors';
import { formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Calendar, Droplet, Gamepad2, Heart, Info, Link as LinkIcon, MessageCircle, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type NotificationItem = {
  id: string;
  type: 'daily_dew' | 'nug' | 'game_invite' | 'bond_request' | 'system' | 'reminder';
  title: string;
  body: string;
  data: any;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
    markAllAsRead(); // Optional: or mark individual? Usually feed view marks as read.
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  };

  const clearAll = async () => {
      if (!user) return;
      setLoading(true);
      const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id);
      
      if (!error) {
          setNotifications([]);
      }
      setLoading(false);
  };

  const handlePress = (item: NotificationItem) => {
    // Navigate if route exists
    if (item.data?.route) {
      router.push(item.data.route);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'daily_dew': return <Droplet size={24} color="#3B82F6" />;
      case 'nug': return <MessageCircle size={24} color="#F59E0B" />;
      case 'game_invite': return <Gamepad2 size={24} color="#8B5CF6" />;
      case 'bond_request': return <LinkIcon size={24} color="#10B981" />;
      case 'anniversary': return <Heart size={24} color="#EF4444" />;
      case 'reminder': return <Calendar size={24} color="#6366F1" />;
      default: return <Info size={24} color={colors.text} />;
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity 
      style={[
        styles.item, 
        { 
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
            borderColor: colors.border
        },
        !item.is_read && { borderLeftWidth: 4, borderLeftColor: colors.primary }
      ]}
      onPress={() => handlePress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F3F4F6' }]}>
        {getIcon(item.type)}
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.itemHeader}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.time, { color: colors.muted }]}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </Text>
        </View>
        <Text style={[styles.body, { color: colors.muted }]} numberOfLines={2}>{item.body}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
           <Trash2 size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Bell size={48} color={colors.muted} style={{ opacity: 0.5, marginBottom: 16 }} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>No notifications yet</Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}

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
    padding: 8,
    marginLeft: -8,
  },
  clearButton: {
      padding: 8,
      marginRight: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  item: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Outfit',
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontFamily: 'Quicksand',
    fontSize: 12,
  },
  body: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    lineHeight: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontFamily: 'Quicksand',
    fontSize: 16,
  }
});
