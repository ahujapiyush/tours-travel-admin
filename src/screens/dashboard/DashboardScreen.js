import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Dimensions, ActivityIndicator, Platform, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { adminAPI } from '../../services/api';
import socketService from '../../services/socket';

const isWeb = Platform.OS === 'web';

export default function DashboardScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { width: screenWidth } = isWeb ? useWindowDimensions() : { width: 400 };

  const fetchDashboard = useCallback(async () => {
    try {
      const { data: res } = await adminAPI.getDashboard();
      setData(res);
    } catch (error) {
      console.error('Dashboard error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    // Real-time booking updates
    socketService.on('new_booking', (payload) => {
      fetchDashboard();
    });
    socketService.on('booking_updated', () => {
      fetchDashboard();
    });
    socketService.on('booking_cancelled', () => {
      fetchDashboard();
    });

    return () => {
      socketService.off('new_booking');
      socketService.off('booking_updated');
      socketService.off('booking_cancelled');
    };
  }, [fetchDashboard]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const stats = data?.stats || {};

  const statCards = [
    { title: 'Total Customers', value: stats.totalCustomers || 0, icon: 'people', color: COLORS.primary, screen: 'Customers' },
    { title: 'Total Cars', value: stats.totalCars || 0, icon: 'car', color: COLORS.secondary, screen: 'Cars' },
    { title: 'Total Bookings', value: stats.totalBookings || 0, icon: 'calendar', color: COLORS.info, screen: 'Bookings' },
    { title: 'Today Bookings', value: stats.todayBookings || 0, icon: 'today', color: COLORS.warning },
    { title: 'Active Bookings', value: stats.activeBookings || 0, icon: 'pulse', color: COLORS.success },
    { title: 'Pending', value: stats.pendingBookings || 0, icon: 'hourglass', color: COLORS.statusPending },
    { title: 'Total Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, icon: 'wallet', color: COLORS.success },
    { title: "Today's Revenue", value: `₹${(stats.todayRevenue || 0).toLocaleString()}`, icon: 'cash', color: COLORS.primary },
  ];

  const statCardWidth = isWeb ? (screenWidth > 1200 ? '23%' : screenWidth > 600 ? '31%' : '48%') : '48%';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={isWeb ? styles.webContent : undefined}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} />}
    >
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsGrid}>
        {statCards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.statCard, { width: statCardWidth }, isWeb && styles.statCardWeb]}
            onPress={() => card.screen && navigation?.navigate(card.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconContainer, { backgroundColor: card.color + '15' }]}>
              <Ionicons name={card.icon} size={24} color={card.color} />
            </View>
            <Text style={styles.statValue}>{card.value}</Text>
            <Text style={styles.statLabel}>{card.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Booking Status & Revenue by City - side by side on web */}
      <View style={isWeb ? styles.webRow : undefined}>
        <View style={isWeb ? styles.webHalf : undefined}>
          <Text style={styles.sectionTitle}>Booking Status</Text>
          <View style={styles.statusContainer}>
        {(data?.statusBreakdown || []).map((item, index) => (
          <View key={index} style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={styles.statusLabel}>{item.status.replace(/_/g, ' ')}</Text>
            <Text style={styles.statusCount}>{item.count}</Text>
          </View>
        ))}
      </View>
        </View>

        <View style={isWeb ? styles.webHalf : undefined}>
      {/* Revenue by City */}
      <Text style={styles.sectionTitle}>Revenue by City</Text>
      <View style={styles.card}>
        {(data?.revenueByCity || []).map((item, index) => (
          <View key={index} style={styles.cityRow}>
            <View style={styles.cityInfo}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text style={styles.cityName}>{item.city_name || 'Unknown'}</Text>
            </View>
            <View style={styles.cityStats}>
              <Text style={styles.cityBookings}>{item.bookings} trips</Text>
              <Text style={styles.cityRevenue}>₹{parseFloat(item.revenue || 0).toLocaleString()}</Text>
            </View>
          </View>
        ))}
        {(!data?.revenueByCity || data.revenueByCity.length === 0) && (
          <Text style={styles.emptyText}>No revenue data yet</Text>
        )}
      </View>
        </View>
      </View>

      {/* Recent Bookings */}
      <Text style={styles.sectionTitle}>Recent Bookings</Text>
      <View style={styles.card}>
        {(data?.recentBookings || []).slice(0, 5).map((booking, index) => (
          <TouchableOpacity
            key={index}
            style={styles.bookingRow}
            onPress={() => navigation?.navigate('BookingDetail', { id: booking.id })}
          >
            <View style={styles.bookingLeft}>
              <Text style={styles.bookingNumber}>#{booking.booking_number}</Text>
              <Text style={styles.bookingCustomer}>{booking.customer_name}</Text>
            </View>
            <View style={styles.bookingRight}>
              <View style={[styles.bookingStatus, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                <Text style={[styles.bookingStatusText, { color: getStatusColor(booking.status) }]}>
                  {booking.status.replace(/_/g, ' ')}
                </Text>
              </View>
              <Text style={styles.bookingAmount}>₹{parseFloat(booking.total_amount || 0).toFixed(0)}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {(!data?.recentBookings || data.recentBookings.length === 0) && (
          <Text style={styles.emptyText}>No bookings yet</Text>
        )}
      </View>

      {/* Cars Status */}
      <Text style={styles.sectionTitle}>Fleet Status</Text>
      <View style={styles.fleetContainer}>
        {(data?.carsByStatus || []).map((item, index) => (
          <View key={index} style={[styles.fleetCard, { borderLeftColor: getCarStatusColor(item.status) }]}>
            <Text style={[styles.fleetCount, { color: getCarStatusColor(item.status) }]}>{item.count}</Text>
            <Text style={styles.fleetLabel}>{item.status}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function getStatusColor(status) {
  const colors = {
    pending: '#F59E0B', confirmed: '#3B82F6', driver_assigned: '#8B5CF6',
    driver_en_route: '#6366F1', arrived: '#14B8A6', in_progress: '#F97316',
    completed: '#10B981', cancelled: '#EF4444', refunded: '#6B7280',
  };
  return colors[status] || COLORS.textSecondary;
}

function getCarStatusColor(status) {
  const colors = { available: '#10B981', booked: '#F59E0B', maintenance: '#EF4444', inactive: '#6B7280' };
  return colors[status] || COLORS.textSecondary;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  webContent: { paddingHorizontal: isWeb ? 24 : SIZES.padding, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 12 },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.padding,
    ...SHADOWS.medium,
    marginBottom: 4,
  },
  statCardWeb: {
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  webRow: { flexDirection: 'row', gap: 16 },
  webHalf: { flex: 1 },
  statIconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  statusContainer: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.padding, ...SHADOWS.small,
  },
  statusItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusLabel: { flex: 1, fontSize: SIZES.md, color: COLORS.text, textTransform: 'capitalize' },
  statusCount: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
  card: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.padding, ...SHADOWS.small },
  cityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  cityInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cityName: { fontSize: SIZES.md, color: COLORS.text, fontWeight: '500' },
  cityStats: { alignItems: 'flex-end' },
  cityBookings: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  cityRevenue: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.success },
  bookingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  bookingLeft: {},
  bookingNumber: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.primary },
  bookingCustomer: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  bookingRight: { alignItems: 'flex-end' },
  bookingStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: SIZES.radiusFull },
  bookingStatusText: { fontSize: SIZES.xs, fontWeight: '600', textTransform: 'capitalize' },
  bookingAmount: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text, marginTop: 4 },
  fleetContainer: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  fleetCard: {
    flex: 1, minWidth: 100, backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    padding: SIZES.padding, borderLeftWidth: 4, ...SHADOWS.small,
  },
  fleetCount: { fontSize: SIZES.xxl, fontWeight: '700' },
  fleetLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, textTransform: 'capitalize', marginTop: 4 },
  emptyText: { textAlign: 'center', color: COLORS.textLight, paddingVertical: 20, fontSize: SIZES.md },
});
