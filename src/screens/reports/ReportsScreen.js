import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { adminAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('day');

  useEffect(() => {
    fetchReports();
  }, [groupBy]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getReports({ group_by: groupBy });
      setReport(data);
    } catch (error) {
      console.error('Reports error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Group By Filter */}
      <View style={styles.filterRow}>
        {['day', 'week', 'month'].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.filterChip, groupBy === option && styles.filterChipActive]}
            onPress={() => setGroupBy(option)}
          >
            <Text style={[styles.filterText, groupBy === option && styles.filterTextActive]}>
              By {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Revenue Timeline */}
      <Text style={styles.sectionTitle}>Revenue Timeline</Text>
      <View style={styles.card}>
        {(report?.report || []).length > 0 ? (
          report.report.map((item, index) => (
            <View key={index} style={styles.timelineRow}>
              <Text style={styles.timelinePeriod}>{item.period}</Text>
              <View style={styles.timelineStats}>
                <View style={styles.timelineStat}>
                  <Text style={styles.statValue}>{item.total_bookings}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.timelineStat}>
                  <Text style={[styles.statValue, { color: COLORS.success }]}>{item.completed}</Text>
                  <Text style={styles.statLabel}>Done</Text>
                </View>
                <View style={styles.timelineStat}>
                  <Text style={[styles.statValue, { color: COLORS.danger }]}>{item.cancelled}</Text>
                  <Text style={styles.statLabel}>Cancel</Text>
                </View>
                <View style={styles.timelineStat}>
                  <Text style={[styles.statValue, { color: COLORS.primary }]}>
                    ₹{parseFloat(item.revenue || 0).toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>Revenue</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No data for selected period</Text>
        )}
      </View>

      {/* Location Stats */}
      <Text style={styles.sectionTitle}>Location Performance</Text>
      <View style={styles.card}>
        {(report?.locationStats || []).map((item, index) => (
          <View key={index} style={styles.locationRow}>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <View>
                <Text style={styles.locationCity}>{item.city_name || 'Unknown'}</Text>
                <Text style={styles.locationState}>{item.state_name || ''}</Text>
              </View>
            </View>
            <View style={styles.locationStats}>
              <Text style={styles.locationBookings}>{item.total_bookings} bookings</Text>
              <Text style={styles.locationRevenue}>₹{parseFloat(item.total_revenue || 0).toLocaleString()}</Text>
            </View>
          </View>
        ))}
        {(!report?.locationStats || report.locationStats.length === 0) && (
          <Text style={styles.emptyText}>No location data</Text>
        )}
      </View>

      {/* Top Cars */}
      <Text style={styles.sectionTitle}>Top Performing Cars</Text>
      <View style={styles.card}>
        {(report?.topCars || []).map((item, index) => (
          <View key={index} style={styles.carRow}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
            <View style={styles.carInfo}>
              <Text style={styles.carName}>{item.brand} {item.car_name}</Text>
              <Text style={styles.carStats}>
                {item.total_bookings} trips • {parseFloat(item.avg_rating || 0).toFixed(1)}★
              </Text>
            </View>
          </View>
        ))}
        {(!report?.topCars || report.topCars.length === 0) && (
          <Text style={styles.emptyText}>No car data</Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '500' },
  filterTextActive: { color: COLORS.textWhite },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 20 },
  card: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.padding, ...SHADOWS.small },
  timelineRow: {
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  timelinePeriod: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  timelineStats: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineStat: { alignItems: 'center' },
  statValue: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationCity: { fontSize: SIZES.md, fontWeight: '500', color: COLORS.text },
  locationState: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  locationStats: { alignItems: 'flex-end' },
  locationBookings: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  locationRevenue: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.success },
  carRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  rankBadge: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  rankText: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.primary },
  carInfo: { flex: 1 },
  carName: { fontSize: SIZES.md, fontWeight: '500', color: COLORS.text },
  carStats: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  emptyText: { textAlign: 'center', color: COLORS.textLight, paddingVertical: 20 },
});
