import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../../utils/alert';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { adminAPI } from '../../services/api';

export default function DriversScreen({ navigation }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchDrivers = useCallback(async () => {
    try {
      const { data } = await adminAPI.getDrivers();
      setDrivers(data.drivers || data || []);
    } catch (err) {
      showAlert('Error', 'Failed to load drivers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const filteredDrivers = drivers.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase()) ||
    d.phone?.includes(search)
  );

  const renderDriver = ({ item }) => (
    <View style={styles.driverCard}>
      <View style={styles.avatarWrap}>
        <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || 'D'}</Text>
      </View>
      <View style={styles.driverInfo}>
        <Text style={styles.driverName}>{item.name}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="call" size={13} color={COLORS.textLight} />
          <Text style={styles.infoText}>{item.phone || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={13} color={COLORS.textLight} />
          <Text style={styles.infoText}>{item.email}</Text>
        </View>
        {item.license_number && (
          <View style={styles.infoRow}>
            <Ionicons name="card" size={13} color={COLORS.textLight} />
            <Text style={styles.infoText}>License: {item.license_number}</Text>
          </View>
        )}
      </View>
      <View style={styles.driverRight}>
        <View style={[styles.statusDot, { backgroundColor: item.is_active ? COLORS.success : COLORS.danger }]} />
        <Text style={[styles.statusLabel, { color: item.is_active ? COLORS.success : COLORS.danger }]}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Text>
        {item.assigned_car && (
          <View style={styles.carBadge}>
            <Ionicons name="car-sport" size={12} color={COLORS.primary} />
            <Text style={styles.carBadgeText}>{item.assigned_car}</Text>
          </View>
        )}
        {item.rating && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={COLORS.warning} />
            <Text style={styles.ratingText}>{parseFloat(item.rating).toFixed(1)}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search drivers..."
          placeholderTextColor={COLORS.textLight}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredDrivers}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderDriver}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDrivers(); }} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No drivers found</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation?.navigate('AddDriver')}
      >
        <Ionicons name="person-add" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius, paddingHorizontal: 14, paddingVertical: 10,
    ...SHADOWS.small, marginBottom: 16, gap: 10,
  },
  searchInput: { flex: 1, fontSize: SIZES.base, color: COLORS.text },
  driverCard: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg,
    padding: 14, marginBottom: 12, ...SHADOWS.small,
  },
  avatarWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.info + '20',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.info },
  driverInfo: { flex: 1 },
  driverName: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  infoText: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  driverRight: { alignItems: 'flex-end', justifyContent: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: SIZES.xs, fontWeight: '600' },
  carBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: SIZES.radiusFull,
  },
  carBadgeText: { fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '500' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: SIZES.base, color: COLORS.textLight, marginTop: 12 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center',
    alignItems: 'center', ...SHADOWS.medium, zIndex: 10,
  },
});
