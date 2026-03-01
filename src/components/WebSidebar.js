import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { name: 'Dashboard', icon: 'grid', screen: 'Dashboard' },
  { name: 'Cars', icon: 'car-sport', screen: 'Cars' },
  { name: 'Bookings', icon: 'calendar', screen: 'Bookings' },
  { name: 'Customers', icon: 'people', screen: 'Customers' },
  { name: 'Drivers', icon: 'person-circle', screen: 'Drivers' },
  { name: 'Live Map', icon: 'map', screen: 'LiveMap' },
  { name: 'Reports', icon: 'bar-chart', screen: 'Reports' },
  { name: 'Notifications', icon: 'notifications', screen: 'Notifications' },
  { name: 'Settings', icon: 'settings', screen: 'More' },
];

export default function WebSidebar({ activeScreen, onNavigate }) {
  const { user, logout } = useAuth();

  return (
    <View style={styles.sidebar}>
      {/* Brand */}
      <View style={styles.brand}>
        <View style={styles.brandIcon}>
          <Ionicons name="car-sport" size={24} color={COLORS.textWhite} />
        </View>
        <Text style={styles.brandTitle}>Tours Admin</Text>
      </View>

      {/* Nav Items */}
      <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeScreen === item.screen;
          return (
            <TouchableOpacity
              key={item.screen}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => onNavigate(item.screen)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? item.icon : `${item.icon}-outline`}
                size={20}
                color={isActive ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {item.name}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User */}
      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'A'}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Admin'}</Text>
          <Text style={styles.userRole}>Administrator</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    backgroundColor: COLORS.surface,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    height: '100%',
    ...(Platform.OS === 'web' ? { position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 } : {}),
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: 12,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  navList: {
    flex: 1,
    paddingTop: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 10,
    gap: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'background-color 0.2s' } : {}),
  },
  navItemActive: {
    backgroundColor: COLORS.primary + '10',
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    flex: 1,
  },
  navTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  userRole: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.danger + '10',
  },
});
