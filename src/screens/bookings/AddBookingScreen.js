import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../../utils/alert';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { adminAPI, carsAPI, locationsAPI } from '../../services/api';

/* ─── Native date/time input for web ─── */
const DateInput = ({ value, onChange, placeholder }) => {
  if (Platform.OS === 'web') {
    return (
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          backgroundColor: COLORS.background, borderRadius: SIZES.radius,
          padding: '12px 14px', fontSize: 14, color: COLORS.text,
          border: `1px solid ${COLORS.divider}`, width: '100%', boxSizing: 'border-box',
          fontFamily: 'inherit', outline: 'none',
        }}
      />
    );
  }
  return (
    <TextInput
      style={inputStyle}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder || 'YYYY-MM-DD'}
      placeholderTextColor={COLORS.textLight}
    />
  );
};

const TimeInput = ({ value, onChange, placeholder }) => {
  if (Platform.OS === 'web') {
    return (
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          backgroundColor: COLORS.background, borderRadius: SIZES.radius,
          padding: '12px 14px', fontSize: 14, color: COLORS.text,
          border: `1px solid ${COLORS.divider}`, width: '100%', boxSizing: 'border-box',
          fontFamily: 'inherit', outline: 'none',
        }}
      />
    );
  }
  return (
    <TextInput
      style={inputStyle}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder || 'HH:MM'}
      placeholderTextColor={COLORS.textLight}
    />
  );
};

const inputStyle = {
  backgroundColor: COLORS.background, borderRadius: SIZES.radius, paddingHorizontal: 14,
  paddingVertical: 12, fontSize: SIZES.base, color: COLORS.text,
  borderWidth: 1, borderColor: COLORS.divider,
};

/* ─── Places Autocomplete Field ─── */
const PlacesAutocompleteField = ({ label, value, onChangeText, onPlaceSelected, placeholder }) => {
  const [predictions, setPredictions] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const fetchPredictions = useCallback(async (text) => {
    if (text.length < 3) { setPredictions([]); return; }
    setSearching(true);
    try {
      const { data } = await locationsAPI.placesAutocomplete(text);
      setPredictions(data?.predictions || []);
    } catch { setPredictions([]); }
    setSearching(false);
  }, []);

  const handleChange = (text) => {
    onChangeText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(text), 400);
  };

  const handleSelect = async (prediction) => {
    onChangeText(prediction.description);
    setPredictions([]);
    try {
      const { data } = await locationsAPI.placeDetails(prediction.place_id);
      onPlaceSelected({
        address: data.address || prediction.description,
        lat: data.lat,
        lng: data.lng,
        name: data.name,
      });
    } catch {
      onPlaceSelected({ address: prediction.description, lat: null, lng: null });
    }
  };

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ position: 'relative', zIndex: 10 }}>
        <View style={styles.inputWithIcon}>
          <Ionicons name="location-outline" size={18} color={COLORS.textLight} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.input, { flex: 1, borderWidth: 0, paddingHorizontal: 0 }]}
            value={value}
            onChangeText={handleChange}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textLight}
          />
          {searching && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>
        {predictions.length > 0 && (
          <View style={styles.predictionsDropdown}>
            {predictions.map((p, idx) => (
              <TouchableOpacity
                key={p.place_id || idx}
                style={[styles.predictionItem, idx === predictions.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => handleSelect(p)}
              >
                <Ionicons name="navigate-outline" size={16} color={COLORS.primary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.predictionMain} numberOfLines={1}>
                    {p.structured_formatting?.main_text || p.description}
                  </Text>
                  <Text style={styles.predictionSub} numberOfLines={1}>
                    {p.structured_formatting?.secondary_text || ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

/* ─── Main Screen ─── */
export default function AddBookingScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [cars, setCars] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // Distance calculation
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);

  const [form, setForm] = useState({
    customer_id: '',
    customer_name: '',
    car_id: '',
    pickup_address: '',
    pickup_lat: null,
    pickup_lng: null,
    pickup_city_id: '',
    drop_address: '',
    drop_lat: null,
    drop_lng: null,
    drop_city_id: '',
    pickup_date: '',
    pickup_time: '',
    return_date: '',
    distance_km: '',
    payment_method: 'cash',
    notes: '',
    state_id: '',
  });

  useEffect(() => { fetchInitialData(); }, []);

  useEffect(() => {
    if (form.state_id) fetchCities(form.state_id);
  }, [form.state_id]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchCustomer.length >= 2) searchCustomers();
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchCustomer]);

  // Auto-calculate distance when both pickup and drop have coordinates
  useEffect(() => {
    if (form.pickup_lat && form.pickup_lng && form.drop_lat && form.drop_lng) {
      calculateDistance();
    }
  }, [form.pickup_lat, form.pickup_lng, form.drop_lat, form.drop_lng]);

  const fetchInitialData = async () => {
    try {
      const [carsRes, statesRes] = await Promise.all([
        carsAPI.getCars({ status: 'available', limit: 100 }),
        locationsAPI.getStates(),
      ]);
      setCars(carsRes.data?.cars || carsRes.data || []);
      setStates(statesRes.data?.states || statesRes.data || []);
    } catch (err) {
      console.log('Init error:', err.message);
    }
  };

  const fetchCities = async (stateId) => {
    try {
      const { data } = await locationsAPI.getCities(stateId);
      setCities(data?.cities || data || []);
    } catch {}
  };

  const searchCustomers = async () => {
    setSearchingCustomers(true);
    try {
      const { data } = await adminAPI.getCustomers({ search: searchCustomer, limit: 10 });
      setCustomers(data?.customers || data || []);
    } catch {}
    setSearchingCustomers(false);
  };

  const calculateDistance = async () => {
    setCalculatingDistance(true);
    try {
      const origins = `${form.pickup_lat},${form.pickup_lng}`;
      const destinations = `${form.drop_lat},${form.drop_lng}`;
      const { data } = await locationsAPI.calculateDistance(origins, destinations);
      if (data?.distance_km) {
        setDistanceInfo(data);
        updateForm('distance_km', data.distance_km.toString());
      }
    } catch (err) {
      console.log('Distance calc error:', err.message);
    }
    setCalculatingDistance(false);
  };

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const selectCustomer = (customer) => {
    updateForm('customer_id', customer.id);
    updateForm('customer_name', customer.name);
    setSearchCustomer(customer.name + ' (' + customer.email + ')');
    setCustomers([]);
  };

  const handlePickupPlaceSelected = (place) => {
    setForm(prev => ({
      ...prev,
      pickup_address: place.address,
      pickup_lat: place.lat,
      pickup_lng: place.lng,
    }));
  };

  const handleDropPlaceSelected = (place) => {
    setForm(prev => ({
      ...prev,
      drop_address: place.address,
      drop_lat: place.lat,
      drop_lng: place.lng,
    }));
  };

  const handleSubmit = async () => {
    if (!form.customer_id || !form.car_id || !form.pickup_address || !form.drop_address || !form.pickup_date) {
      showAlert('Validation', 'Please fill all required fields (customer, car, pickup/drop address, pickup date)');
      return;
    }

    setLoading(true);
    try {
      // Combine date and time into ISO string
      const pickupDateTime = form.pickup_time
        ? `${form.pickup_date}T${form.pickup_time}:00`
        : `${form.pickup_date}T00:00:00`;

      const payload = {
        customer_id: form.customer_id,
        car_id: parseInt(form.car_id),
        pickup_address: form.pickup_address,
        pickup_city_id: form.pickup_city_id ? parseInt(form.pickup_city_id) : undefined,
        drop_address: form.drop_address,
        drop_city_id: form.drop_city_id ? parseInt(form.drop_city_id) : undefined,
        pickup_time: pickupDateTime,
        return_date: form.return_date || undefined,
        distance_km: form.distance_km ? parseFloat(form.distance_km) : undefined,
        payment_method: form.payment_method,
        notes: form.notes || undefined,
      };

      await adminAPI.createBooking(payload);
      showAlert('Success', 'Booking created successfully');
      navigation.goBack();
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const renderPicker = (label, value, options, onSelect, keyExtractor, labelExtractor) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {(Array.isArray(options) ? options : []).map(opt => {
          const key = keyExtractor(opt);
          const isSelected = value === key.toString();
          return (
            <TouchableOpacity
              key={key}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => onSelect(key.toString())}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {labelExtractor(opt)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Customer Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Search Customer *</Text>
            <TextInput
              style={styles.input}
              value={searchCustomer}
              onChangeText={v => { setSearchCustomer(v); updateForm('customer_id', ''); updateForm('customer_name', ''); }}
              placeholder="Type name, email or phone..."
              placeholderTextColor={COLORS.textLight}
            />
            {searchingCustomers && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 6 }} />}
            {customers.length > 0 && (
              <View style={styles.suggestionList}>
                {customers.map(c => (
                  <TouchableOpacity key={c.id} style={styles.suggestionItem} onPress={() => selectCustomer(c)}>
                    <View style={styles.suggestionAvatar}>
                      <Text style={styles.suggestionAvatarText}>{c.name?.charAt(0)?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionName}>{c.name}</Text>
                      <Text style={styles.suggestionEmail}>{c.email} • {c.phone}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {form.customer_id ? (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.selectedText}>{form.customer_name}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Car Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Car *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {cars.map(car => {
              const isSelected = form.car_id === car.id.toString();
              return (
                <TouchableOpacity
                  key={car.id}
                  style={[styles.carOption, isSelected && styles.carOptionActive]}
                  onPress={() => updateForm('car_id', car.id.toString())}
                >
                  <View style={styles.carIconWrap}>
                    <Ionicons name="car-sport" size={22} color={isSelected ? COLORS.primary : COLORS.textLight} />
                  </View>
                  <Text style={[styles.carOptionName, isSelected && { color: COLORS.primary }]} numberOfLines={1}>
                    {car.name}
                  </Text>
                  <Text style={styles.carOptionMeta}>{car.brand} • {car.seats} seats</Text>
                  <Text style={styles.carOptionPrice}>₹{car.price_per_km}/km</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Trip Details */}
        <View style={[styles.card, { zIndex: 20 }]}>
          <Text style={styles.sectionTitle}>Trip Details</Text>

          {/* Pickup Address — Google Places Autocomplete */}
          <View style={{ zIndex: 12 }}>
            <PlacesAutocompleteField
              label="Pickup Address *"
              value={form.pickup_address}
              onChangeText={v => { updateForm('pickup_address', v); updateForm('pickup_lat', null); updateForm('pickup_lng', null); }}
              onPlaceSelected={handlePickupPlaceSelected}
              placeholder="Search pickup location..."
            />
          </View>

          {/* Drop Address — Google Places Autocomplete */}
          <View style={{ zIndex: 11 }}>
            <PlacesAutocompleteField
              label="Drop Address *"
              value={form.drop_address}
              onChangeText={v => { updateForm('drop_address', v); updateForm('drop_lat', null); updateForm('drop_lng', null); }}
              onPlaceSelected={handleDropPlaceSelected}
              placeholder="Search drop location..."
            />
          </View>

          {renderPicker('State', form.state_id, states, v => { updateForm('state_id', v); updateForm('pickup_city_id', ''); updateForm('drop_city_id', ''); setCities([]); }, s => s.id, s => s.name)}

          {cities.length > 0 && (
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                {renderPicker('Pickup City', form.pickup_city_id, cities, v => updateForm('pickup_city_id', v), c => c.id, c => c.name)}
              </View>
              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                {renderPicker('Drop City', form.drop_city_id, cities, v => updateForm('drop_city_id', v), c => c.id, c => c.name)}
              </View>
            </View>
          )}

          {/* Date & Time Pickers */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Pickup Date *</Text>
              <DateInput
                value={form.pickup_date}
                onChange={v => updateForm('pickup_date', v)}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Pickup Time *</Text>
              <TimeInput
                value={form.pickup_time}
                onChange={v => updateForm('pickup_time', v)}
                placeholder="HH:MM"
              />
            </View>
          </View>

          {/* Return Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Return Date</Text>
            <DateInput
              value={form.return_date}
              onChange={v => updateForm('return_date', v)}
              placeholder="YYYY-MM-DD (optional)"
            />
          </View>

          {/* Distance — Auto-calculated */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Est. Distance (km)</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="speedometer-outline" size={18} color={COLORS.textLight} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0, paddingHorizontal: 0 }]}
                value={form.distance_km}
                onChangeText={v => updateForm('distance_km', v)}
                keyboardType="decimal-pad"
                placeholder="Auto-calculated from addresses"
                placeholderTextColor={COLORS.textLight}
              />
              {calculatingDistance && <ActivityIndicator size="small" color={COLORS.primary} />}
            </View>
            {distanceInfo && (
              <View style={styles.distanceBadge}>
                <View style={styles.distanceStat}>
                  <Ionicons name="navigate" size={14} color={COLORS.primary} />
                  <Text style={styles.distanceText}>{distanceInfo.distance_text}</Text>
                </View>
                <View style={styles.distanceStat}>
                  <Ionicons name="time" size={14} color={COLORS.primary} />
                  <Text style={styles.distanceText}>{distanceInfo.duration_text}</Text>
                </View>
                <TouchableOpacity onPress={calculateDistance} style={styles.refreshBtn}>
                  <Ionicons name="refresh" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentRow}>
              {['cash', 'upi', 'card'].map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.paymentChip, form.payment_method === m && styles.paymentChipActive]}
                  onPress={() => updateForm('payment_method', m)}
                >
                  <Ionicons
                    name={m === 'cash' ? 'cash-outline' : m === 'upi' ? 'phone-portrait-outline' : 'card-outline'}
                    size={16}
                    color={form.payment_method === m ? '#FFF' : COLORS.textSecondary}
                  />
                  <Text style={[styles.paymentText, form.payment_method === m && { color: '#FFF' }]}>
                    {m.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.notes}
              onChangeText={v => updateForm('notes', v)}
              multiline
              numberOfLines={3}
              placeholder="Any additional notes..."
              placeholderTextColor={COLORS.textLight}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color={COLORS.textWhite} />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color={COLORS.textWhite} />
              <Text style={styles.submitText}>Create Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.padding,
    ...SHADOWS.small, marginBottom: 16,
  },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.background, borderRadius: SIZES.radius, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: SIZES.base, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.divider,
  },
  inputWithIcon: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: SIZES.radius, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.divider,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  chipRow: { flexDirection: 'row' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.background, marginRight: 8, borderWidth: 1, borderColor: COLORS.divider,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '500' },
  chipTextActive: { color: COLORS.textWhite },

  /* Customer search */
  suggestionList: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius, borderWidth: 1,
    borderColor: COLORS.divider, marginTop: 6, overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  suggestionAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  suggestionAvatarText: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.primary },
  suggestionName: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  suggestionEmail: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  selectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    backgroundColor: COLORS.success + '10', padding: 8, borderRadius: SIZES.radius,
  },
  selectedText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.success },

  /* Car selection */
  carOption: {
    width: 140, backgroundColor: COLORS.background, borderRadius: SIZES.radiusLg,
    padding: 12, marginRight: 10, borderWidth: 2, borderColor: COLORS.divider, alignItems: 'center',
  },
  carOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  carIconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.divider,
  },
  carOptionName: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  carOptionMeta: { fontSize: 10, color: COLORS.textLight, marginTop: 2 },
  carOptionPrice: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.primary, marginTop: 4 },

  /* Places autocomplete */
  predictionsDropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    borderWidth: 1, borderColor: COLORS.divider, marginTop: 4,
    ...SHADOWS.medium, maxHeight: 220, overflow: 'hidden',
  },
  predictionItem: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  predictionMain: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  predictionSub: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },

  /* Distance info */
  distanceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8,
    backgroundColor: COLORS.primary + '08', padding: 10, borderRadius: SIZES.radius,
  },
  distanceStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distanceText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text },
  refreshBtn: { marginLeft: 'auto', padding: 4 },

  /* Payment */
  paymentRow: { flexDirection: 'row', gap: 10 },
  paymentChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: SIZES.radius, backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.divider,
  },
  paymentChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  paymentText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg, padding: 16,
    ...SHADOWS.medium, marginTop: 4,
  },
  submitText: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.textWhite },
});
