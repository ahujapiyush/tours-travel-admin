import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { carsAPI, locationsAPI } from '../../services/api';
import { CAR_STATUSES } from '../../constants/config';

export default function CarsScreen({ navigation }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const fetchCars = useCallback(async (page = 1) => {
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (selectedState) params.state_id = selectedState;
      if (selectedCity) params.city_id = selectedCity;

      const { data } = await carsAPI.getCars(params);
      setCars(page === 1 ? data.cars : [...cars, ...data.cars]);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Cars error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedState, selectedCity]);

  const fetchLocations = useCallback(async () => {
    try {
      const { data } = await locationsAPI.getStates();
      setStates(data.states);
    } catch (error) {
      console.error('Locations error:', error.message);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => fetchCars(1), 300);
    return () => clearTimeout(timeout);
  }, [search, selectedState, selectedCity]);

  useEffect(() => {
    if (selectedState) {
      locationsAPI.getCities(selectedState).then(({ data }) => setCities(data.cities));
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedState]);

  const renderCarItem = ({ item }) => {
    const statusInfo = CAR_STATUSES[item.status] || { label: item.status, color: '#6B7280' };

    return (
      <TouchableOpacity
        style={styles.carCard}
        onPress={() => navigation?.navigate('CarDetail', { id: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.carHeader}>
          <View style={styles.carTitleRow}>
            <Text style={styles.carName}>{item.brand} {item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
          </View>
          <Text style={styles.carModel}>{item.model} • {item.year}</Text>
        </View>

        <View style={styles.carDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="people" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.seats} seats</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="color-palette" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.color}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="speedometer" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.mileage} km/l</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cog" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.transmission}</Text>
          </View>
        </View>

        <View style={styles.carFooter}>
          <View>
            <Text style={styles.locationText}>
              <Ionicons name="location" size={12} color={COLORS.primary} /> {item.city_name}, {item.state_name}
            </Text>
            <Text style={styles.regNumber}>{item.registration_number}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>₹{item.price_per_km}/km</Text>
            <Text style={styles.basePrice}>Base: ₹{item.base_price}</Text>
          </View>
        </View>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.ratingText}>{item.rating || 0}</Text>
          <Text style={styles.tripsText}>• {item.total_trips || 0} trips</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cars..."
            placeholderTextColor={COLORS.textLight}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        <ScrollableFilter
          label="State"
          items={states}
          selected={selectedState}
          onSelect={setSelectedState}
        />
        {cities.length > 0 && (
          <ScrollableFilter
            label="City"
            items={cities}
            selected={selectedCity}
            onSelect={setSelectedCity}
          />
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={cars}
          renderItem={renderCarItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCars(1); }} />}
          onEndReached={() => {
            if (pagination.page < pagination.totalPages) fetchCars(pagination.page + 1);
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No cars found</Text>
            </View>
          }
        />
      )}

      {/* FAB for adding new car */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation?.navigate('AddCar')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={COLORS.textWhite} />
      </TouchableOpacity>
    </View>
  );
}

function ScrollableFilter({ label, items, selected, onSelect }) {
  return (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterChip, !selected && styles.filterChipActive]}
        onPress={() => onSelect(null)}
      >
        <Text style={[styles.filterChipText, !selected && styles.filterChipTextActive]}>All {label}s</Text>
      </TouchableOpacity>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.filterChip, selected === item.id && styles.filterChipActive]}
          onPress={() => onSelect(selected === item.id ? null : item.id)}
        >
          <Text style={[styles.filterChipText, selected === item.id && styles.filterChipTextActive]}>
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchContainer: { padding: SIZES.padding, paddingBottom: 8 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius, paddingHorizontal: 14, height: 46, ...SHADOWS.small,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: SIZES.md, color: COLORS.text },
  filterRow: { paddingHorizontal: SIZES.padding },
  filterContainer: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  filterChipTextActive: { color: COLORS.textWhite, fontWeight: '600' },
  listContent: { padding: SIZES.padding, paddingTop: 4 },
  carCard: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg,
    padding: SIZES.padding, marginBottom: 12, ...SHADOWS.medium,
  },
  carHeader: { marginBottom: 12 },
  carTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  carName: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull },
  statusText: { fontSize: SIZES.xs, fontWeight: '600', textTransform: 'capitalize' },
  carModel: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  carDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: SIZES.sm, color: COLORS.textSecondary, textTransform: 'capitalize' },
  carFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.divider },
  locationText: { fontSize: SIZES.sm, color: COLORS.text },
  regNumber: { fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 2 },
  priceContainer: { alignItems: 'flex-end' },
  priceLabel: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.primary },
  basePrice: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  ratingText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text },
  tripsText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: SIZES.base, color: COLORS.textLight, marginTop: 16 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.large,
  },
});
