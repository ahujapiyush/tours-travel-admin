import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, ActivityIndicator,
  TouchableOpacity, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { carsAPI, adminAPI } from '../../services/api';
import socketService from '../../services/socket';

const { width, height } = Dimensions.get('window');

// Conditional import for Maps (not available on web)
let MapView, Marker;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

export default function LiveMapScreen() {
  const [cars, setCars] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchData();

    // Listen for real-time location updates
    socketService.on('car_location', (data) => {
      setCars((prev) =>
        prev.map((car) =>
          car.id === data.car_id
            ? { ...car, current_lat: data.latitude, current_lng: data.longitude }
            : car
        )
      );
    });

    socketService.on('driver_location', (data) => {
      setDrivers((prev) =>
        prev.map((driver) =>
          driver.user_id === data.driver_id
            ? { ...driver, current_lat: data.latitude, current_lng: data.longitude }
            : driver
        )
      );
    });

    return () => {
      socketService.off('car_location');
      socketService.off('driver_location');
    };
  }, []);

  const fetchData = async () => {
    try {
      const [carsRes, driversRes] = await Promise.all([
        carsAPI.getCars({ limit: 100 }),
        adminAPI.getDrivers(),
      ]);
      setCars(carsRes.data.cars.filter((c) => c.current_lat && c.current_lng));
      setDrivers(driversRes.data.drivers.filter((d) => d.current_lat && d.current_lng));
    } catch (error) {
      console.error('Map data error:', error.message);
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

  // Web fallback - show list view with coordinates
  if (Platform.OS === 'web') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.webHeader}>
          <Ionicons name="map" size={48} color={COLORS.primary} />
          <Text style={styles.webTitle}>Live Fleet Tracking</Text>
          <Text style={styles.webSubtitle}>
            Google Maps requires native platform. Showing fleet locations below.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Cars ({cars.length})</Text>
        {cars.map((car) => (
          <View key={car.id} style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Ionicons name="car" size={20} color={COLORS.primary} />
              <Text style={styles.locationName}>{car.brand} {car.name}</Text>
              <View style={[styles.statusDot, {
                backgroundColor: car.status === 'available' ? COLORS.success : COLORS.warning
              }]} />
            </View>
            <Text style={styles.locationDetails}>
              {car.city_name}, {car.state_name} • {car.registration_number}
            </Text>
            <Text style={styles.coordinates}>
              📍 {parseFloat(car.current_lat).toFixed(4)}, {parseFloat(car.current_lng).toFixed(4)}
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Drivers ({drivers.length})</Text>
        {drivers.map((driver) => (
          <View key={driver.id} style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Ionicons name="person" size={20} color={COLORS.secondary} />
              <Text style={styles.locationName}>{driver.name}</Text>
              <View style={[styles.statusDot, {
                backgroundColor: driver.status === 'available' ? COLORS.success :
                  driver.status === 'on_trip' ? COLORS.warning : COLORS.danger
              }]} />
            </View>
            <Text style={styles.locationDetails}>
              {driver.city_name}, {driver.state_name} • Rating: {driver.rating}★
            </Text>
            <Text style={styles.coordinates}>
              📍 {parseFloat(driver.current_lat).toFixed(4)}, {parseFloat(driver.current_lng).toFixed(4)}
            </Text>
          </View>
        ))}
      </ScrollView>
    );
  }

  // Native Map View
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 20.5937,
          longitude: 78.9629,
          latitudeDelta: 15,
          longitudeDelta: 15,
        }}
        showsUserLocation
      >
        {/* Car Markers */}
        {cars.map((car) => (
          <Marker
            key={`car-${car.id}`}
            coordinate={{
              latitude: parseFloat(car.current_lat),
              longitude: parseFloat(car.current_lng),
            }}
            title={`${car.brand} ${car.name}`}
            description={`${car.registration_number} • ${car.status}`}
            onPress={() => setSelectedCar(car)}
            pinColor={car.status === 'available' ? 'green' : 'orange'}
          />
        ))}

        {/* Driver Markers */}
        {drivers.map((driver) => (
          <Marker
            key={`driver-${driver.id}`}
            coordinate={{
              latitude: parseFloat(driver.current_lat),
              longitude: parseFloat(driver.current_lng),
            }}
            title={driver.name}
            description={`Driver • ${driver.status}`}
            pinColor="blue"
          />
        ))}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'green' }]} />
          <Text style={styles.legendText}>Available Car</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'orange' }]} />
          <Text style={styles.legendText}>Booked Car</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'blue' }]} />
          <Text style={styles.legendText}>Driver</Text>
        </View>
      </View>

      {/* Selected Car Info */}
      {selectedCar && (
        <View style={styles.carInfoPanel}>
          <TouchableOpacity style={styles.closePanel} onPress={() => setSelectedCar(null)}>
            <Ionicons name="close" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.panelName}>{selectedCar.brand} {selectedCar.name}</Text>
          <Text style={styles.panelDetail}>{selectedCar.model} • {selectedCar.year} • {selectedCar.color}</Text>
          <Text style={styles.panelDetail}>{selectedCar.registration_number}</Text>
          <Text style={styles.panelDetail}>{selectedCar.seats} seats • {selectedCar.fuel_type} • {selectedCar.transmission}</Text>
          <Text style={styles.panelPrice}>₹{selectedCar.price_per_km}/km</Text>
        </View>
      )}

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={fetchData}>
        <Ionicons name="refresh" size={22} color={COLORS.textWhite} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { width, height },

  // Web styles
  webHeader: { alignItems: 'center', padding: 40, backgroundColor: COLORS.surface },
  webTitle: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  webSubtitle: { fontSize: SIZES.md, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, padding: SIZES.padding, paddingBottom: 8 },
  locationCard: {
    backgroundColor: COLORS.surface, marginHorizontal: SIZES.padding, marginBottom: 10,
    borderRadius: SIZES.radius, padding: SIZES.padding, ...SHADOWS.small,
  },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  locationName: { flex: 1, fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  locationDetails: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginLeft: 30 },
  coordinates: { fontSize: SIZES.sm, color: COLORS.primary, marginLeft: 30, marginTop: 4 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },

  // Native styles
  legend: {
    position: 'absolute', top: 16, right: 16, backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius, padding: 12, ...SHADOWS.medium,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: SIZES.sm, color: COLORS.text },
  carInfoPanel: {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg,
    padding: SIZES.padding, ...SHADOWS.large,
  },
  closePanel: { position: 'absolute', top: 12, right: 12 },
  panelName: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  panelDetail: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  panelPrice: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.primary, marginTop: 8 },
  refreshButton: {
    position: 'absolute', bottom: 24, right: 16, width: 48, height: 48,
    borderRadius: 24, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium,
  },
});
