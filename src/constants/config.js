import { Platform } from 'react-native';

// Use localhost for iOS simulator, 10.0.2.2 for Android emulator
const getBaseUrl = () => {
  return 'https://tours-travel-backend.vercel.app';
  // For local dev, comment the above and use:
  // if (Platform.OS === 'android') return 'http://10.0.2.2:5001';
  // return 'http://localhost:5001';
};

export const API_BASE_URL = getBaseUrl();
export const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

export const BOOKING_STATUSES = {
  pending: { label: 'Pending', color: '#F59E0B' },
  confirmed: { label: 'Confirmed', color: '#3B82F6' },
  driver_assigned: { label: 'Driver Assigned', color: '#8B5CF6' },
  driver_en_route: { label: 'En Route', color: '#6366F1' },
  arrived: { label: 'Arrived', color: '#14B8A6' },
  in_progress: { label: 'In Progress', color: '#F97316' },
  completed: { label: 'Completed', color: '#10B981' },
  cancelled: { label: 'Cancelled', color: '#EF4444' },
  refunded: { label: 'Refunded', color: '#6B7280' },
};

export const CAR_STATUSES = {
  available: { label: 'Available', color: '#10B981' },
  booked: { label: 'Booked', color: '#F59E0B' },
  maintenance: { label: 'Maintenance', color: '#EF4444' },
  inactive: { label: 'Inactive', color: '#6B7280' },
};
