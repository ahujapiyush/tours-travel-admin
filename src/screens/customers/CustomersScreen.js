import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { adminAPI } from '../../services/api';

export default function CustomersScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const fetchCustomers = useCallback(async (page = 1) => {
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;

      const { data } = await adminAPI.getCustomers(params);
      setCustomers(page === 1 ? data.customers : [...customers, ...data.customers]);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Customers error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => fetchCustomers(1), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const renderCustomerItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <View style={styles.metaRow}>
          {item.phone && (
            <View style={styles.metaItem}>
              <Ionicons name="call" size={12} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{item.phone}</Text>
            </View>
          )}
          {item.city_name && (
            <View style={styles.metaItem}>
              <Ionicons name="location" size={12} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{item.city_name}, {item.state_name}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.statsColumn}>
        <View style={styles.bookingCountBadge}>
          <Text style={styles.bookingCount}>{item.total_bookings || 0}</Text>
          <Text style={styles.bookingLabel}>trips</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: item.is_active ? COLORS.success : COLORS.danger }]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
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

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={customers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCustomers(1); }} />}
          onEndReached={() => {
            if (pagination.page < pagination.totalPages) fetchCustomers(pagination.page + 1);
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No customers found</Text>
            </View>
          }
          ListHeaderComponent={
            <Text style={styles.countText}>
              {pagination.total || 0} customers
            </Text>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation?.navigate('AddCustomer')}
      >
        <Ionicons name="person-add" size={22} color="#fff" />
      </TouchableOpacity>
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
  listContent: { padding: SIZES.padding, paddingTop: 0 },
  countText: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 12, fontWeight: '500' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg, padding: SIZES.padding, marginBottom: 10, ...SHADOWS.small,
  },
  avatarContainer: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.primary },
  info: { flex: 1 },
  name: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  email: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  statsColumn: { alignItems: 'center', gap: 8 },
  bookingCountBadge: {
    backgroundColor: COLORS.primary + '10', borderRadius: SIZES.radius,
    paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center',
  },
  bookingCount: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.primary },
  bookingLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: SIZES.base, color: COLORS.textLight, marginTop: 16 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center',
    alignItems: 'center', ...SHADOWS.medium, zIndex: 10,
  },
});
