// Web stub for react-native-maps — native-only module
import React from 'react';
import { View } from 'react-native';

const MapView = React.forwardRef((props, ref) => (
  <View ref={ref} {...props} style={[{ backgroundColor: '#E5E7EB' }, props.style]}>
    {props.children}
  </View>
));
MapView.displayName = 'MapViewStub';

const Marker = () => null;
const Callout = () => null;
const Circle = () => null;
const Polyline = () => null;
const Polygon = () => null;
const Overlay = () => null;
const Heatmap = () => null;

export default MapView;
export {
  Marker,
  Callout,
  Circle,
  Polyline,
  Polygon,
  Overlay,
  Heatmap,
};
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;
