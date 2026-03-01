import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../../utils/alert';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { BOOKING_STATUSES } from '../../constants/config';
import { bookingsAPI } from '../../services/api';
import socketService from '../../services/socket';

const STATUS_FLOW = ['pending', 'confirmed', 'driver_assigned', 'in_progress', 'completed'];

export default function BookingDetailScreen({ navigation, route }) {
  const bookingId = route.params?.bookingId || route.params?.id;
  const [booking, setBooking] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchBooking();
    socketService.joinBooking(bookingId);
    socketService.on('booking_update', handleBookingUpdate);
    return () => {
      socketService.leaveBooking(bookingId);
      socketService.off('booking_update', handleBookingUpdate);
    };
  }, []);

  const handleBookingUpdate = (data) => {
    if (data.booking_id === bookingId) {
      setBooking(prev => prev ? { ...prev, ...data } : prev);
    }
  };

  const fetchBooking = async () => {
    try {
      const { data } = await bookingsAPI.getBookingById(bookingId);
      setBooking(data.booking || data);
      setTracking(data.tracking || []);
    } catch (err) {
      showAlert('Error', 'Failed to load booking');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (newStatus) => {
    showAlert(
      'Update Status',
      `Change status to "${newStatus.replace('_', ' ').toUpperCase()}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setUpdating(true);
            try {
              await bookingsAPI.updateStatus(bookingId, { status: newStatus });
              setBooking(prev => ({ ...prev, status: newStatus }));
              showAlert('Success', 'Booking status updated');
            } catch (err) {
              showAlert('Error', err.response?.data?.message || 'Failed to update');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    showAlert('Cancel Booking', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          setUpdating(true);
          try {
            await bookingsAPI.cancelBooking(bookingId, { reason: 'Cancelled by admin' });
            setBooking(prev => ({ ...prev, status: 'cancelled' }));
          } catch (err) {
            showAlert('Error', 'Failed to cancel');
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  const getStatusInfo = (status) => {
    const info = BOOKING_STATUSES[status];
    return info ? { ...info, value: status } : { label: status, color: COLORS.textLight, value: status };
  };

  const getNextStatuses = () => {
    if (!booking) return [];
    const currentIndex = STATUS_FLOW.indexOf(booking.status);
    if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) return [];
    return STATUS_FLOW.slice(currentIndex + 1);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!booking) return null;

  const statusInfo = getStatusInfo(booking.status);
  const nextStatuses = getNextStatuses();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Status Header */}
      <View style={[styles.statusHeader, { backgroundColor: statusInfo.color + '15' }]}>
        <View style={[styles.statusIconWrap, { backgroundColor: statusInfo.color + '30' }]}>
          <Ionicons name="document-text" size={28} color={statusInfo.color} />
        </View>
        <Text style={styles.bookingId}>#{booking.booking_number || booking.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '25' }]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* Route Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Route</Text>
        <View style={styles.routeContainer}>
          <View style={styles.routeLine}>
            <View style={[styles.routeDot, { backgroundColor: COLORS.success }]} />
            <View style={styles.routeConnector} />
            <View style={[styles.routeDot, { backgroundColor: COLORS.danger }]} />
          </View>
          <View style={styles.routeDetails}>
            <View style={styles.routePoint}>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeValue}>{booking.pickup_address || booking.pickup_city || 'N/A'}</Text>
            </View>
            <View style={[styles.routePoint, { marginTop: 20 }]}>
              <Text style={styles.routeLabel}>DROP</Text>
              <Text style={styles.routeValue}>{booking.drop_address || booking.drop_city || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Customer Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <DetailRow icon="person" label="Name" value={booking.customer_name || `User #${booking.customer_id}`} />
        <DetailRow icon="call" label="Phone" value={booking.customer_phone || '-'} />
        <DetailRow icon="mail" label="Email" value={booking.customer_email || '-'} />
      </View>

      {/* Car & Driver Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Car & Driver</Text>
        <DetailRow icon="car-sport" label="Car" value={booking.car_name ? `${booking.car_brand || ''} ${booking.car_name}`.trim() : `Car #${booking.car_id}`} />
        {booking.car_model && (
          <DetailRow icon="information-circle" label="Model" value={booking.car_model} />
        )}
        {booking.registration_number && (
          <DetailRow icon="document" label="Reg. Number" value={booking.registration_number} />
        )}
        {booking.driver_name && (
          <DetailRow icon="person-circle" label="Driver" value={booking.driver_name} />
        )}
        {booking.driver_phone && (
          <DetailRow icon="call" label="Driver Phone" value={booking.driver_phone} />
        )}
      </View>

      {/* Booking Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Booking Details</Text>
        <DetailRow icon="calendar" label="Pickup Date" value={booking.pickup_time ? new Date(booking.pickup_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'} />
        <DetailRow icon="time" label="Pickup Time" value={booking.pickup_time ? new Date(booking.pickup_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'} />
        <DetailRow icon="calendar" label="Return Date" value={booking.return_date ? new Date(booking.return_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'} />
        <DetailRow icon="navigate" label="Distance" value={booking.distance_km ? `${booking.distance_km} km` : '-'} />
        <DetailRow icon="hourglass" label="Duration" value={booking.estimated_duration_minutes ? `${booking.estimated_duration_minutes} min` : '-'} />
      </View>

      {/* Pricing Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <DetailRow icon="pricetag" label="Base Fare" value={`₹${parseFloat(booking.base_fare || 0).toLocaleString()}`} />
        {parseFloat(booking.distance_fare) > 0 && (
          <DetailRow icon="speedometer" label="Distance Fare" value={`₹${parseFloat(booking.distance_fare).toLocaleString()}`} />
        )}
        {parseFloat(booking.discount) > 0 && (
          <DetailRow icon="ticket" label="Discount" value={`-₹${parseFloat(booking.discount).toLocaleString()}`} />
        )}
        {parseFloat(booking.tax) > 0 && (
          <DetailRow icon="receipt" label="Tax" value={`₹${parseFloat(booking.tax).toLocaleString()}`} />
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{parseFloat(booking.total_amount || 0).toLocaleString()}</Text>
        </View>
        <DetailRow icon="card" label="Payment Method" value={(booking.payment_method || 'cash').toUpperCase()} />
        <DetailRow icon="card" label="Payment Status" value={booking.payment_status || 'pending'} />
        {booking.coupon_code && (
          <DetailRow icon="gift" label="Coupon" value={booking.coupon_code} />
        )}
      </View>

      {/* Extra Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Additional Info</Text>
        <DetailRow icon="chatbubble" label="Notes" value={booking.notes || 'None'} />
        <DetailRow icon="time" label="Booked On" value={booking.created_at ? new Date(booking.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'} />
      </View>

      {/* Tracking */}
      {tracking.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Activity Log</Text>
          {tracking.map((track, index) => (
            <View key={index} style={styles.trackItem}>
              <View style={styles.trackDot} />
              <View style={styles.trackInfo}>
                <Text style={styles.trackStatus}>{track.status?.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.trackTime}>
                  {new Date(track.created_at).toLocaleString()}
                </Text>
                {track.note && <Text style={styles.trackNote}>{track.note}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Status Actions */}
      {nextStatuses.length > 0 && !['cancelled', 'completed'].includes(booking.status) && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          {updating && <ActivityIndicator color={COLORS.primary} style={{ marginBottom: 10 }} />}
          <View style={styles.statusActions}>
            {nextStatuses.map(status => {
              const info = getStatusInfo(status);
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusBtn, { backgroundColor: info.color + '15', borderColor: info.color }]}
                  onPress={() => handleStatusUpdate(status)}
                  disabled={updating}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statusBtnText, { color: info.color }]}>
                    {info.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Cancel Button */}
      {!['cancelled', 'completed'].includes(booking.status) && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={updating} activeOpacity={0.7}>
          <Ionicons name="close-circle" size={20} color={COLORS.danger} />
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={16} color={COLORS.primary} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusHeader: {
    borderRadius: SIZES.radiusLg, padding: 24, alignItems: 'center', marginBottom: 16,
  },
  statusIconWrap: {
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  bookingId: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text },
  statusBadge: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: SIZES.radiusFull, marginTop: 8,
  },
  statusText: { fontSize: SIZES.sm, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.padding,
    ...SHADOWS.small, marginBottom: 16,
  },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  routeContainer: { flexDirection: 'row' },
  routeLine: { alignItems: 'center', marginRight: 14, paddingVertical: 4 },
  routeDot: { width: 12, height: 12, borderRadius: 6 },
  routeConnector: { width: 2, flex: 1, backgroundColor: COLORS.divider, marginVertical: 4 },
  routeDetails: { flex: 1 },
  routePoint: {},
  routeLabel: { fontSize: SIZES.xs, fontWeight: '700', color: COLORS.textLight, letterSpacing: 1 },
  routeValue: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  detailLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  detailValue: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, textAlign: 'right', flex: 1 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, marginTop: 4, borderTopWidth: 2, borderTopColor: COLORS.primary,
  },
  totalLabel: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  totalValue: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.primary },
  trackItem: { flexDirection: 'row', marginBottom: 14 },
  trackDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary,
    marginTop: 5, marginRight: 12,
  },
  trackInfo: { flex: 1 },
  trackStatus: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text },
  trackTime: { fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 2 },
  trackNote: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  statusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: SIZES.radius,
    borderWidth: 1.5,
  },
  statusBtnText: { fontSize: SIZES.sm, fontWeight: '700' },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.danger + '10', borderRadius: SIZES.radiusLg, padding: 14,
    borderWidth: 1, borderColor: COLORS.danger + '30',
  },
  cancelText: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.danger },
});
