import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Platform, KeyboardAvoidingView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../../utils/alert';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/config';
import { carsAPI, locationsAPI } from '../../services/api';

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const TRANSMISSION_TYPES = ['Manual', 'Automatic'];
const CAR_STATUSES = ['available', 'booked', 'maintenance', 'inactive'];
const ASSET_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.replace('/api', '') : API_BASE_URL;

export default function AddCarScreen({ navigation, route }) {
  const editCarRaw = route.params?.car;
  const editCar = editCarRaw?.car || editCarRaw || null;
  const editCarId = editCar?.id || route.params?.carId || route.params?.id || null;
  const isEdit = !!editCarId;

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImages, setUploadedImages] = useState(
    Array.isArray(editCar?.images)
      ? editCar.images.filter((url) => typeof url === 'string' && /\/assets\/car\/\d+\/\d+$/.test(url))
      : []
  );
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: editCar?.name || '',
    brand: editCar?.brand || '',
    model: editCar?.model || '',
    year: editCar?.year?.toString() || new Date().getFullYear().toString(),
    registration_number: editCar?.registration_number || '',
    category_id: editCar?.category_id?.toString() || '',
    city_id: editCar?.city_id?.toString() || '',
    state_id: editCar?.state_id?.toString() || '',
    fuel_type: editCar?.fuel_type || 'Petrol',
    transmission: editCar?.transmission || 'Manual',
    seats: editCar?.seats?.toString() || '5',
    price_per_km: editCar?.price_per_km?.toString() || '',
    base_price: editCar?.base_price?.toString() || '',
    ac: editCar?.ac !== false,
    description: editCar?.description || '',
    features: Array.isArray(editCar?.features)
      ? editCar.features.join(', ')
      : (typeof editCar?.features === 'string' ? editCar.features : ''),
    image_url: editCar?.image_url || '',
    images: Array.isArray(editCar?.images)
      ? editCar.images.filter((url) => typeof url === 'string' && !/\/assets\/car\/\d+\/\d+$/.test(url)).join(', ')
      : '',
    status: editCar?.status || 'active',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (form.state_id) {
      fetchCities(form.state_id);
    }
  }, [form.state_id]);

  const fetchData = async () => {
    try {
      const [statesRes, categoriesRes] = await Promise.all([
        locationsAPI.getStates(),
        carsAPI.getCategories(),
      ]);
      setStates(statesRes.data?.states || statesRes.data || []);
      setCategories(categoriesRes.data?.categories || categoriesRes.data || []);
    } catch (err) {
      showAlert('Error', 'Failed to load data');
    }
  };

  const fetchCities = async (stateId) => {
    try {
      const { data } = await locationsAPI.getCities(stateId);
      setCities(data?.cities || data || []);
    } catch {}
  };

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleUploadImage = async () => {
    if (Platform.OS !== 'web') {
      showAlert('Not Supported', 'File input upload is available on web admin.');
      return;
    }
    if (!isEdit || !editCarId) {
      showAlert('Save Car First', 'Create the car first, then upload images in edit mode to get a permanent URL.');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', file);
        const { data } = await carsAPI.uploadImageForCar(editCarId, formData);
        if (data?.image_url) {
          setUploadedImages(prev => [data.image_url, ...prev.filter(u => u !== data.image_url)].slice(0, 10));
          if (!form.image_url) {
            updateForm('image_url', data.image_url);
          }
          showAlert('Success', 'Image uploaded successfully');
        } else {
          showAlert('Error', 'Upload completed but no image URL returned');
        }
      } catch (err) {
        showAlert('Error', err.response?.data?.error || 'Image upload failed');
      } finally {
        setUploadingImage(false);
      }
    };
    input.click();
  };

  const handleSubmit = async () => {
    if (!form.name || !form.brand || !form.registration_number || !form.state_id || !form.city_id ||
        !form.price_per_km || !form.base_price || !form.category_id) {
      showAlert('Validation', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const manualImages = form.images
        ? form.images.split(',').map(i => i.trim()).filter(Boolean)
        : [];
      const allImages = [...uploadedImages, ...manualImages].filter(Boolean);

      const payload = {
        ...form,
        year: parseInt(form.year),
        seats: parseInt(form.seats),
        state_id: parseInt(form.state_id),
        category_id: parseInt(form.category_id),
        city_id: parseInt(form.city_id),
        price_per_km: parseFloat(form.price_per_km),
        base_price: parseFloat(form.base_price),
        features: form.features ? form.features.split(',').map(f => f.trim()).filter(Boolean) : [],
        image_url: form.image_url?.trim() || null,
        images: allImages,
      };

      if (isEdit) {
        if (!editCarId) {
          showAlert('Error', 'Car ID is missing. Please reopen edit screen.');
          return;
        }
        await carsAPI.updateCar(editCarId, payload);
        showAlert('Success', 'Car updated successfully');
      } else {
        await carsAPI.createCar(payload);
        showAlert('Success', 'Car added successfully');
      }
      navigation.goBack();
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Failed to save car');
    } finally {
      setLoading(false);
    }
  };

  const renderPicker = (label, value, options, onSelect, keyExtractor, labelExtractor) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label} *</Text>
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

  const renderSimplePicker = (label, value, options, onSelect) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {options.map(opt => {
          const isSelected = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => onSelect(opt)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Car Name *</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={v => updateForm('name', v)} placeholder="e.g. Swift Dzire" placeholderTextColor={COLORS.textLight} />
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Brand *</Text>
              <TextInput style={styles.input} value={form.brand} onChangeText={v => updateForm('brand', v)} placeholder="e.g. Maruti" placeholderTextColor={COLORS.textLight} />
            </View>
            <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Model</Text>
              <TextInput style={styles.input} value={form.model} onChangeText={v => updateForm('model', v)} placeholder="e.g. Dzire VXi" placeholderTextColor={COLORS.textLight} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Year</Text>
              <TextInput style={styles.input} value={form.year} onChangeText={v => updateForm('year', v)} keyboardType="number-pad" placeholderTextColor={COLORS.textLight} />
            </View>
            <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Registration # *</Text>
              <TextInput style={styles.input} value={form.registration_number} onChangeText={v => updateForm('registration_number', v)} placeholder="MH01AB1234" autoCapitalize="characters" placeholderTextColor={COLORS.textLight} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Seats</Text>
              <TextInput style={styles.input} value={form.seats} onChangeText={v => updateForm('seats', v)} keyboardType="number-pad" placeholderTextColor={COLORS.textLight} />
            </View>
            <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>AC</Text>
              <TouchableOpacity
                style={[styles.toggleBtn, form.ac && styles.toggleActive]}
                onPress={() => updateForm('ac', !form.ac)}
              >
                <Ionicons name={form.ac ? 'checkmark-circle' : 'close-circle'} size={20} color={form.ac ? COLORS.success : COLORS.textLight} />
                <Text style={[styles.toggleText, form.ac && { color: COLORS.success }]}>
                  {form.ac ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Category & Specs</Text>
          {renderPicker('Category', form.category_id, categories, v => updateForm('category_id', v), c => c.id, c => c.name)}
          {renderSimplePicker('Fuel Type', form.fuel_type, FUEL_TYPES, v => updateForm('fuel_type', v))}
          {renderSimplePicker('Transmission', form.transmission, TRANSMISSION_TYPES, v => updateForm('transmission', v))}
          {isEdit && renderSimplePicker('Status', form.status, CAR_STATUSES, v => updateForm('status', v))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location</Text>
          {renderPicker('State', form.state_id, states, v => { updateForm('state_id', v); updateForm('city_id', ''); }, s => s.id, s => s.name)}
          {cities.length > 0 && renderPicker('City', form.city_id, cities, v => updateForm('city_id', v), c => c.id, c => c.name)}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Base Price (₹) *</Text>
              <TextInput style={styles.input} value={form.base_price} onChangeText={v => updateForm('base_price', v)} keyboardType="decimal-pad" placeholder="500" placeholderTextColor={COLORS.textLight} />
            </View>
            <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Price/Km (₹) *</Text>
              <TextInput style={styles.input} value={form.price_per_km} onChangeText={v => updateForm('price_per_km', v)} keyboardType="decimal-pad" placeholder="12" placeholderTextColor={COLORS.textLight} />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Additional</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Primary Image URL</Text>
            <TextInput
              style={styles.input}
              value={form.image_url}
              onChangeText={v => updateForm('image_url', v)}
              placeholder={`${ASSET_BASE_URL}/assets/cars/sedan.svg`}
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="none"
            />
            {uploadedImages.length > 0 && (
              <>
                <Text style={styles.helperText}>{uploadedImages.length} uploaded image(s) attached to this car</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewRow}>
                  {uploadedImages.map((uri, idx) => (
                    <Image key={`${idx}-${uri.slice(0, 24)}`} source={{ uri }} style={styles.previewImage} resizeMode="cover" />
                  ))}
                </ScrollView>
              </>
            )}
            <TouchableOpacity
              style={[styles.uploadBtn, uploadingImage && { opacity: 0.7 }]}
              onPress={handleUploadImage}
              disabled={uploadingImage || !isEdit}
              activeOpacity={0.8}
            >
              {uploadingImage ? (
                <ActivityIndicator color={COLORS.textWhite} size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={16} color={COLORS.textWhite} />
                  <Text style={styles.uploadBtnText}>Upload from device</Text>
                </>
              )}
            </TouchableOpacity>
            {!isEdit && (
              <Text style={styles.helperText}>Save this car first, then open Edit to upload and get permanent image URLs.</Text>
            )}
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>More Image URLs (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={form.images}
              onChangeText={v => updateForm('images', v)}
              placeholder="https://.../img1.jpg, https://.../img2.jpg"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} value={form.description} onChangeText={v => updateForm('description', v)} multiline numberOfLines={3} placeholder="Describe the car..." placeholderTextColor={COLORS.textLight} />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Features (comma separated)</Text>
            <TextInput style={styles.input} value={form.features} onChangeText={v => updateForm('features', v)} placeholder="GPS, Bluetooth, USB Charging" placeholderTextColor={COLORS.textLight} />
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color={COLORS.textWhite} />
          ) : (
            <>
              <Ionicons name={isEdit ? 'save' : 'add-circle'} size={20} color={COLORS.textWhite} />
              <Text style={styles.submitText}>{isEdit ? 'Update Car' : 'Add Car'}</Text>
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
  helperText: { fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 8, marginBottom: 6 },
  previewRow: { marginBottom: 8 },
  previewImage: {
    width: 76,
    height: 56,
    borderRadius: SIZES.radius,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.background,
  },
  uploadBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  uploadBtnText: { color: COLORS.textWhite, fontSize: SIZES.sm, fontWeight: '600' },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.background,
    borderRadius: SIZES.radius, padding: 12, borderWidth: 1, borderColor: COLORS.divider,
  },
  toggleActive: { borderColor: COLORS.success + '40' },
  toggleText: { fontSize: SIZES.base, color: COLORS.textLight, fontWeight: '500' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg, padding: 16,
    ...SHADOWS.medium, marginTop: 4,
  },
  submitText: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.textWhite },
});
