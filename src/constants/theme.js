export const COLORS = {
  primary: '#1E40AF',      // Deep blue
  primaryLight: '#3B82F6',
  primaryDark: '#1E3A8A',
  secondary: '#7C3AED',    // Purple
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#0891B2',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E2E8F0',
  divider: '#F1F5F9',

  text: '#0F172A',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  textWhite: '#FFFFFF',

  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',

  // Status colors
  statusPending: '#F59E0B',
  statusConfirmed: '#3B82F6',
  statusInProgress: '#8B5CF6',
  statusCompleted: '#10B981',
  statusCancelled: '#EF4444',
};

export const FONTS = {
  regular: { fontFamily: 'System', fontWeight: '400' },
  medium: { fontFamily: 'System', fontWeight: '500' },
  semibold: { fontFamily: 'System', fontWeight: '600' },
  bold: { fontFamily: 'System', fontWeight: '700' },
};

export const SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,

  radius: 8,
  radiusLg: 12,
  radiusXl: 16,
  radiusFull: 100,

  padding: 16,
  paddingSm: 8,
  paddingLg: 24,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
