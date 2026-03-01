/**
 * Polling-based real-time service — replaces Socket.IO for Vercel deployments.
 * Same public API as the old SocketService so admin screens need no changes.
 * Includes browser notification + sound support for web.
 */
import { API_BASE_URL } from '../constants/config';
import { Platform } from 'react-native';

const API_ROOT = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
const isWeb = Platform.OS === 'web';

let SecureStore;
if (!isWeb) {
  SecureStore = require('expo-secure-store');
}

/* ── Browser notification helpers ── */
let notifPermission = isWeb ? (typeof Notification !== 'undefined' ? Notification.permission : 'denied') : 'denied';

function requestNotificationPermission() {
  if (!isWeb || typeof Notification === 'undefined') return;
  if (notifPermission === 'default') {
    Notification.requestPermission().then((p) => { notifPermission = p; });
  }
}

function showBrowserNotification(title, body) {
  if (!isWeb || notifPermission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon: 'https://tours-admin.expo.app/favicon.ico',
      badge: 'https://tours-admin.expo.app/favicon.ico',
      tag: 'tours-admin-' + Date.now(),
      requireInteraction: true,
    });
    n.onclick = () => { window.focus(); n.close(); };
  } catch { /* silent */ }
}

/* ── Notification sound (web only) ── */
let _audioCtx = null;
function playNotificationSound() {
  if (!isWeb) return;
  try {
    // Use AudioContext for a reliable two-tone chime
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _audioCtx;
    const now = ctx.currentTime;

    const playTone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(880, now, 0.15);        // A5
    playTone(1174.66, now + 0.18, 0.25); // D6
  } catch { /* silent */ }
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
    requestNotificationPermission();
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
        const isFirstLoad = this._lastNotifId === null;
        this._lastNotifId = latest.id;
        this._fire('new_notification', latest);
        if (!isFirstLoad) {
          playNotificationSound();
          showBrowserNotification(latest.title || 'New Notification', latest.body || latest.message || '');
        }
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
        const isFirstLoad = this._lastBookingId === null;
        this._lastBookingId = latest.id;
        this._fire('new_booking', { booking: latest });
        if (!isFirstLoad) {
          playNotificationSound();
          showBrowserNotification(
            '🚗 New Booking!',
            `Booking #${latest.booking_number || ''} — ${latest.pickup_address || ''} → ${latest.drop_address || ''}`,
          );
        }
      }
    } catch {
      // silent
    }
  }
}

export default new PollingService();
