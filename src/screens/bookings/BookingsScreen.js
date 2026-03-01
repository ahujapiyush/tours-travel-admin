import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { bookingsAPI } from '../../services/api';
import socketService from '../../services/socket';

const STATUS_FILTERS = [
  { key: null, label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function BookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const fetchBookings = useCallback(async (page = 1) => {
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;

      const { data } = await bookingsAPI.getBookings(params);
      setBookings(page === 1 ? data.bookings : [...bookings, ...data.bookings]);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Bookings error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchBookings(1);
  }, [statusFilter]);

  useEffect(() => {
    // Real-time updates
    socketService.on('new_booking', () => fetchBookings(1));
    socketService.on('booking_updated', () => fetchBookings(1));
    socketService.on('booking_cancelled', () => fetchBookings(1));

    return () => {
      socketService.off('new_booking');
      socketService.off('booking_updated');
      socketService.off('booking_cancelled');
    };
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      pending: '#F59E0B', confirmed: '#3B82F6', driver_assigned: '#8B5CF6',
      driver_en_route: '#6366F1', arrived: '#14B8A6', in_progress: '#F97316',
      completed: '#10B981', cancelled: '#EF4444', refunded: '#6B7280',
    };
    return colors[status] || COLORS.textSecondary;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderBookingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => navigation?.navigate('BookingDetail', { id: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.bookingHeader}>
        <View>
          <Text style={styles.bookingNumber}>#{item.booking_number}</Text>
          <Text style={styles.customerName}>{item.customer_name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.routeText} numberOfLines={1}>{item.pickup_address || item.pickup_city_name || 'Pickup'}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: COLORS.danger }]} />
          <Text style={styles.routeText} numberOfLines={1}>{item.drop_address || item.drop_city_name || 'Drop'}</Text>
        </View>
      </View>

      <View style={styles.bookingFooter}>
        <View style={styles.footerLeft}>
          <Ionicons name="car" size={14} color={COLORS.textSecondary} />
          <Text style={styles.footerText}>{item.car_brand} {item.car_name}</Text>
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.dateText}>{formatDate(item.pickup_time)}</Text>
          <Text style={styles.amountText}>₹{parseFloat(item.total_amount || 0).toFixed(0)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Status Filter */}
      <View style={styles.filterScroll}>
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key || 'all'}
            style={[styles.filterChip, statusFilter === filter.key && styles.filterChipActive]}
            onPress={() => setStatusFilter(filter.key)}
          >
            <Text style={[styles.filterText, statusFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(1); }} />}
          onEndReached={() => {
            if (pagination.page < pagination.totalPages) fetchBookings(pagination.page + 1);
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No bookings found</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation?.navigate('AddBooking')}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterScroll: {
    flexDirection: 'row', paddingHorizontal: SIZES.padding, paddingVertical: 12,
    gap: 8, flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.textWhite, fontWeight: '600' },
  listContent: { padding: SIZES.padding, paddingTop: 0 },
  bookingCard: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg,
    padding: SIZES.padding, marginBottom: 12, ...SHADOWS.medium,
  },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  bookingNumber: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.primary },
  customerName: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull },
  statusText: { fontSize: SIZES.xs, fontWeight: '600', textTransform: 'capitalize' },
  routeContainer: { marginBottom: 12, paddingLeft: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { width: 2, height: 16, backgroundColor: COLORS.border, marginLeft: 4 },
  routeText: { fontSize: SIZES.sm, color: COLORS.text, flex: 1 },
  bookingFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  footerRight: { alignItems: 'flex-end' },
  dateText: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  amountText: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: SIZES.base, color: COLORS.textLight, marginTop: 16 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center',
    alignItems: 'center', ...SHADOWS.medium, zIndex: 10,
  },
});
