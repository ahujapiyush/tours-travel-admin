import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

/**
 * WebContainer - Centers content with max-width on web, passthrough on native.
 * Use this to wrap screen content for responsive web layouts.
 */
export default function WebContainer({ children, style, maxWidth = 1200, fullWidth = false }) {
  if (Platform.OS !== 'web' || fullWidth) {
    return <View style={[styles.full, style]}>{children}</View>;
  }

  return (
    <View style={[styles.webOuter, style]}>
      <View style={[styles.webInner, { maxWidth }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
  },
  webOuter: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  webInner: {
    flex: 1,
    width: '100%',
  },
});
