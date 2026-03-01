import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../../utils/alert';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { adminAPI, locationsAPI } from '../../services/api';

export default function AddDriverScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    license_number: '',
    license_expiry: '',
    experience_years: '',
    state_id: '',
    city_id: '',
  });

  useEffect(() => { fetchStates(); }, []);

  useEffect(() => {
    if (form.state_id) fetchCities(form.state_id);
  }, [form.state_id]);

  const fetchStates = async () => {
    try {
      const { data } = await locationsAPI.getStates();
      setStates(data?.states || data || []);
    } catch {}
  };

  const fetchCities = async (stateId) => {
    try {
      const { data } = await locationsAPI.getCities(stateId);
      setCities(data?.cities || data || []);
    } catch {}
  };

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone) {
      showAlert('Validation', 'Name, email and phone are required');
      return;
    }
    if (!form.license_number || !form.license_expiry) {
      showAlert('Validation', 'License number and expiry date are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password || undefined,
        license_number: form.license_number,
        license_expiry: form.license_expiry,
        experience_years: form.experience_years ? parseInt(form.experience_years) : 0,
        state_id: form.state_id ? parseInt(form.state_id) : undefined,
        city_id: form.city_id ? parseInt(form.city_id) : undefined,
      };

      await adminAPI.createDriver(payload);
      showAlert('Success', 'Driver created successfully');
      navigation.goBack();
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Failed to create driver');
    } finally {
      setLoading(false);
    }
  };

  const renderPicker = (label, value, options, onSelect, keyExtractor, labelExtractor) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {options.map(opt => {
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
        {/* Personal Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Driver Information</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={v => updateForm('name', v)}
              placeholder="e.g. Ramesh Verma"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={v => updateForm('email', v)}
                placeholder="driver@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Phone *</Text>
              <TextInput
                style={styles.input}
                value={form.phone}
                onChangeText={v => updateForm('phone', v)}
                placeholder="9876543210"
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={form.password}
              onChangeText={v => updateForm('password', v)}
              placeholder="Leave blank for default (Driver@123)"
              secureTextEntry
              placeholderTextColor={COLORS.textLight}
            />
          </View>
        </View>

        {/* License & Experience */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>License & Experience</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>License Number *</Text>
            <TextInput
              style={styles.input}
              value={form.license_number}
              onChangeText={v => updateForm('license_number', v)}
              placeholder="e.g. CG01-20200012345"
              autoCapitalize="characters"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>License Expiry *</Text>
              <TextInput
                style={styles.input}
                value={form.license_expiry}
                onChangeText={v => updateForm('license_expiry', v)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Experience (years)</Text>
              <TextInput
                style={styles.input}
                value={form.experience_years}
                onChangeText={v => updateForm('experience_years', v)}
                placeholder="e.g. 5"
                keyboardType="number-pad"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location</Text>
          {renderPicker('State', form.state_id, states, v => { updateForm('state_id', v); updateForm('city_id', ''); setCities([]); }, s => s.id, s => s.name)}
          {cities.length > 0 && renderPicker('City', form.city_id, cities, v => updateForm('city_id', v), c => c.id, c => c.name)}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color={COLORS.textWhite} />
          ) : (
            <>
              <Ionicons name="person-add" size={20} color={COLORS.textWhite} />
              <Text style={styles.submitText}>Add Driver</Text>
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
  row: { flexDirection: 'row' },
  chipRow: { flexDirection: 'row' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.background, marginRight: 8, borderWidth: 1, borderColor: COLORS.divider,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '500' },
  chipTextActive: { color: COLORS.textWhite },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg, padding: 16,
    ...SHADOWS.medium, marginTop: 4,
  },
  submitText: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.textWhite },
});
