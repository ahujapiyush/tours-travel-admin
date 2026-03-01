import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../../utils/alert';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { carsAPI } from '../../services/api';

export default function CarDetailScreen({ navigation, route }) {
  const carId = route.params?.carId || route.params?.id;
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCar();
  }, []);

  const fetchCar = async () => {
    try {
      const { data } = await carsAPI.getCarById(carId);
      setCar(data?.car || data);
    } catch (err) {
      showAlert('Error', 'Failed to load car details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    showAlert('Delete Car', 'Are you sure you want to delete this car?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await carsAPI.deleteCar(carId);
            showAlert('Success', 'Car deleted');
            navigation.goBack();
          } catch {
            showAlert('Error', 'Failed to delete car');
          }
        },
      },
    ]);
  };

  const getStatusColor = (status) => {
    const map = { active: COLORS.success, maintenance: COLORS.warning, inactive: COLORS.danger };
    return map[status] || COLORS.textLight;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!car) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Ionicons name="car-sport" size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.carName}>{car.name}</Text>
        <Text style={styles.carBrand}>{car.brand} {car.model}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(car.status) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(car.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(car.status) }]}>
            {car.status?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="speedometer" size={20} color={COLORS.primary} />
          <Text style={styles.statValue}>₹{car.price_per_km}/km</Text>
          <Text style={styles.statLabel}>Per Km</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="cash" size={20} color={COLORS.success} />
          <Text style={styles.statValue}>₹{car.base_price}</Text>
          <Text style={styles.statLabel}>Base Price</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="people" size={20} color={COLORS.info} />
          <Text style={styles.statValue}>{car.seats}</Text>
          <Text style={styles.statLabel}>Seats</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar" size={20} color={COLORS.warning} />
          <Text style={styles.statValue}>{car.year}</Text>
          <Text style={styles.statLabel}>Year</Text>
        </View>
      </View>

      {/* Details Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Specifications</Text>
        <DetailRow icon="document-text" label="Registration" value={car.registration_number} />
        <DetailRow icon="layers" label="Category" value={car.category_name || `Cat #${car.category_id}`} />
        <DetailRow icon="flame" label="Fuel Type" value={car.fuel_type} />
        <DetailRow icon="settings" label="Transmission" value={car.transmission} />
        <DetailRow icon="snow" label="AC" value={car.ac ? 'Yes' : 'No'} />
      </View>

      {/* Location Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Location</Text>
        <DetailRow icon="location" label="City" value={car.city_name || `City #${car.city_id}`} />
        <DetailRow icon="map" label="State" value={car.state_name || '-'} />
        {car.current_latitude && (
          <DetailRow icon="navigate" label="GPS" value={`${car.current_latitude}, ${car.current_longitude}`} />
        )}
      </View>

      {/* Features */}
      {car.features && car.features.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresWrap}>
            {car.features.map((f, i) => (
              <View key={i} style={styles.featureChip}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Description */}
      {car.description && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{car.description}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
          onPress={() => navigation.navigate('AddCar', { car })}
          activeOpacity={0.8}
        >
          <Ionicons name="create" size={18} color={COLORS.textWhite} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.danger }]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={18} color={COLORS.textWhite} />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroCard: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: 24,
    alignItems: 'center', ...SHADOWS.medium, marginBottom: 16,
  },
  heroIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  carName: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.text },
  carBrand: { fontSize: SIZES.base, color: COLORS.textSecondary, marginTop: 4 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: SIZES.radiusFull, marginTop: 12, gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: SIZES.sm, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg,
    padding: 16, ...SHADOWS.small, marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: SIZES.xs, color: COLORS.textLight },
  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.padding,
    ...SHADOWS.small, marginBottom: 16,
  },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { fontSize: SIZES.base, color: COLORS.textSecondary },
  detailValue: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  featuresWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.success + '10',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: SIZES.radiusFull,
  },
  featureText: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '500' },
  description: { fontSize: SIZES.base, color: COLORS.textSecondary, lineHeight: 22 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: SIZES.radiusLg, ...SHADOWS.small,
  },
  actionText: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textWhite },
});
