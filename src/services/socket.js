/**
 * Polling-based real-time service — replaces Socket.IO for Vercel deployments.
 * Same public API as the old SocketService so admin screens need no changes.
 */
import { API_BASE_URL } from '../constants/config';
import { Platform } from 'react-native';

const API_ROOT = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

let SecureStore;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

const getToken = async () => {
  try {
    if (Platform.OS === 'web') return localStorage.getItem('auth_token');
    return await SecureStore.getItemAsync('auth_token');
  } catch {
    return null;
  }
};

const apiFetch = async (path) => {
  const token = await getToken();
  const res = await fetch(`${API_ROOT}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Poll ${path} failed: ${res.status}`);
  return res.json();
};

class PollingService {
  constructor() {
    this._listeners = {};
    this._intervals = {};
    this._lastNotifId = null;
    this._lastBookingId = null;
    this._connected = false;
  }

  connect(token) {
    if (this._connected) return;
    this._connected = true;
    console.log('[Poll] Admin service connected');
    this._startNotificationPoll();
    this._startBookingPoll();
  }

  disconnect() {
    this._connected = false;
    Object.values(this._intervals).forEach(clearInterval);
    this._intervals = {};
    console.log('[Poll] Admin service disconnected');
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this._listeners[event]) return;
    if (callback) {
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    } else {
      delete this._listeners[event];
    }
  }

  emit(event, data) {
    // Admin doesn't emit location; no-op for compatibility
  }

  joinBooking(bookingId) {}
  leaveBooking(bookingId) {}
  sendLocationUpdate(data) {}
  sendETAUpdate(data) {}

  get isConnected() {
    return this._connected;
  }

  _fire(event, data) {
    (this._listeners[event] || []).forEach(cb => {
      try { cb(data); } catch (e) { console.warn('[Poll] listener error:', e); }
    });
  }

  _startNotificationPoll() {
    clearInterval(this._intervals['notifications']);
    this._pollNotifications();
    this._intervals['notifications'] = setInterval(() => this._pollNotifications(), 10000);
  }

  async _pollNotifications() {
    try {
      const { notifications } = await apiFetch('/poll/notifications');
      if (!notifications?.length) return;
      const latest = notifications[0];
      if (latest && latest.id !== this._lastNotifId) {
        this._lastNotifId = latest.id;
        this._fire('new_notification', latest);
      }
    } catch {
      // silent
    }
  }

  _startBookingPoll() {
    clearInterval(this._intervals['bookings']);
    this._pollBookings();
    this._intervals['bookings'] = setInterval(() => this._pollBookings(), 15000);
  }

  async _pollBookings() {
    try {
      const { bookings } = await apiFetch('/bookings?status=pending&page=1&limit=1');
      const latest = bookings?.[0];
      if (latest && latest.id !== this._lastBookingId) {
        this._lastBookingId = latest.id;
        this._fire('new_booking', { booking: latest });
      }
    } catch {
      // silent
    }
  }
}

export default new PollingService();
