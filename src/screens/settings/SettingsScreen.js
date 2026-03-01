import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../../utils/alert';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../services/api';

export default function SettingsScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationsAPI.getNotifications({ unread_only: 'true', limit: 1 });
      setNotifCount(data.unread_count || 0);
    } catch {}
  };

  const handleLogout = () => {
    showAlert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems = [
    { icon: 'notifications', label: 'Notifications', badge: notifCount, onPress: () => navigation?.navigate('Notifications') },
    { icon: 'people', label: 'Manage Drivers', onPress: () => navigation?.navigate('Drivers') },
    { icon: 'bar-chart', label: 'Reports', onPress: () => navigation?.navigate('Reports') },
    { icon: 'map', label: 'Live Map', onPress: () => navigation?.navigate('LiveMap') },
    { icon: 'location', label: 'Manage Locations', onPress: () => {} },
    { icon: 'help-circle', label: 'Support Tickets', onPress: () => {} },
    { icon: 'information-circle', label: 'About', onPress: () => {} },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || 'Admin'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Admin</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
              <Ionicons name={item.icon} size={22} color={COLORS.primary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <View style={styles.menuRight}>
              {item.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
        <Ionicons name="log-out" size={22} color={COLORS.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg, padding: SIZES.paddingLg, ...SHADOWS.medium, marginBottom: 20,
  },
  avatarContainer: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  avatarText: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.textWhite },
  profileInfo: { flex: 1 },
  profileName: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text },
  profileEmail: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  roleBadge: {
    marginTop: 6, backgroundColor: COLORS.primary + '15', paddingHorizontal: 10,
    paddingVertical: 3, borderRadius: SIZES.radiusFull, alignSelf: 'flex-start',
  },
  roleText: { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.primary },
  menuContainer: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, ...SHADOWS.small, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuLabel: { fontSize: SIZES.base, color: COLORS.text, fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    backgroundColor: COLORS.danger, borderRadius: 10, minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  badgeText: { fontSize: SIZES.xs, color: COLORS.textWhite, fontWeight: '700' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg,
    padding: SIZES.padding, marginTop: 20, ...SHADOWS.small,
  },
  logoutText: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.danger },
});
