import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  let token;
  if (Platform.OS === 'web') {
    token = localStorage.getItem('auth_token');
  } else {
    token = await SecureStore.getItemAsync('auth_token');
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - handled by auth context
    }
    return Promise.reject(error);
  }
);

// ── Auth ──
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  updatePushToken: (token) => api.post('/auth/push-token', { push_token: token }),
};

// ── Cars ──
export const carsAPI = {
  getCars: (params) => api.get('/cars', { params }),
  getCarById: (id) => api.get(`/cars/${id}`),
  createCar: (data) => api.post('/cars', data),
  updateCar: (id, data) => api.put(`/cars/${id}`, data),
  deleteCar: (id) => api.delete(`/cars/${id}`),
  updateLocation: (id, data) => api.put(`/cars/${id}/location`, data),
  uploadImageForCar: (id, formData) => api.post(`/cars/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadImage: (formData) => api.post('/cars/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getCategories: () => api.get('/cars/categories'),
};

// ── Bookings ──
export const bookingsAPI = {
  getBookings: (params) => api.get('/bookings', { params }),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  createBooking: (data) => api.post('/bookings', data),
  updateStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  cancelBooking: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
  rateBooking: (id, data) => api.post(`/bookings/${id}/rate`, data),
};

// ── Locations ──
export const locationsAPI = {
  getStates: () => api.get('/locations/states'),
  getCities: (stateId) => api.get('/locations/cities', { params: { state_id: stateId } }),
  createState: (data) => api.post('/locations/states', data),
  createCity: (data) => api.post('/locations/cities', data),
  placesAutocomplete: (input) => api.get('/locations/places/autocomplete', { params: { input } }),
  placeDetails: (place_id) => api.get('/locations/places/details', { params: { place_id } }),
  calculateDistance: (origins, destinations) => api.get('/locations/distance', { params: { origins, destinations } }),
};

// ── Admin ──
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getCustomers: (params) => api.get('/admin/customers', { params }),
  createCustomer: (data) => api.post('/admin/customers', data),
  createBooking: (data) => api.post('/admin/bookings', data),
  getReports: (params) => api.get('/admin/reports', { params }),
  getDrivers: () => api.get('/admin/drivers'),
  createDriver: (data) => api.post('/admin/drivers', data),
  assignCar: (driverId, carId) => api.put(`/admin/drivers/${driverId}/assign-car`, { car_id: carId }),
};

// ── Notifications ──
export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// ── Customer extras ──
export const customerAPI = {
  getFavorites: () => api.get('/customer/favorites'),
  addFavorite: (carId) => api.post('/customer/favorites', { car_id: carId }),
  removeFavorite: (carId) => api.delete(`/customer/favorites/${carId}`),
  validateCoupon: (code, amount) => api.get('/customer/coupons/validate', { params: { code, amount } }),
};

export default api;
