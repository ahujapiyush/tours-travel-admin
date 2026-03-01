import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../../utils/alert';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { notificationsAPI } from '../../services/api';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationsAPI.getNotifications({ limit: 50 });
      setNotifications(data.notifications || data || []);
    } catch (err) {
      showAlert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const getIcon = (type) => {
    const map = {
      booking: 'calendar',
      payment: 'card',
      driver: 'person-circle',
      car: 'car-sport',
      system: 'settings',
      alert: 'warning',
    };
    return map[type] || 'notifications';
  };

  const getIconColor = (type) => {
    const map = {
      booking: COLORS.primary,
      payment: COLORS.success,
      driver: COLORS.info,
      car: COLORS.warning,
      system: COLORS.textSecondary,
      alert: COLORS.danger,
    };
    return map[type] || COLORS.primary;
  };

  const renderNotification = ({ item }) => {
    const iconColor = getIconColor(item.type);
    return (
      <TouchableOpacity
        style={[styles.notifItem, !item.is_read && styles.unread]}
        onPress={() => !item.is_read && handleMarkRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrap, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={getIcon(item.type)} size={20} color={iconColor} />
        </View>
        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, !item.is_read && styles.notifTitleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.notifTime}>
            {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
          </Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead} activeOpacity={0.7}>
          <Ionicons name="checkmark-done" size={18} color={COLORS.primary} />
          <Text style={styles.markAllText}>Mark all as read ({unreadCount})</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderNotification}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary + '10', borderRadius: SIZES.radius, padding: 10,
    marginBottom: 12,
  },
  markAllText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.primary },
  notifItem: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius, padding: 14, marginBottom: 10, ...SHADOWS.small,
  },
  unread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: SIZES.base, fontWeight: '500', color: COLORS.text },
  notifTitleUnread: { fontWeight: '700' },
  notifMessage: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
  notifTime: { fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 6 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 6,
  },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: SIZES.base, color: COLORS.textLight, marginTop: 12 },
});
