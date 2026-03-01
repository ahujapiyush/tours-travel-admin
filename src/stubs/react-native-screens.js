// Web stub for react-native-screens — native-only TurboModule
import React from 'react';
import { View, Animated } from 'react-native';

// No-op enablers
export function enableScreens() {}
export function enableFreeze() {}
export const screensEnabled = () => true;

// Screen components that just render as Views
const ScreenComponent = React.forwardRef((props, ref) => (
  <View ref={ref} style={[{ flex: 1 }, props.style]}>
    {props.children}
  </View>
));
ScreenComponent.displayName = 'Screen';

const ScreenContainerComponent = React.forwardRef((props, ref) => (
  <View ref={ref} style={[{ flex: 1 }, props.style]}>
    {props.children}
  </View>
));
ScreenContainerComponent.displayName = 'ScreenContainer';

const ScreenStackComponent = React.forwardRef((props, ref) => (
  <View ref={ref} style={[{ flex: 1 }, props.style]}>
    {props.children}
  </View>
));
ScreenStackComponent.displayName = 'ScreenStack';

const ScreenStackHeaderConfigComponent = () => null;

const AnimatedScreen = Animated.createAnimatedComponent(ScreenComponent);

// Named exports
export const Screen = ScreenComponent;
export const ScreenContainer = ScreenContainerComponent;
export const ScreenStack = ScreenStackComponent;
export const ScreenStackHeaderConfig = ScreenStackHeaderConfigComponent;
export const NativeScreen = ScreenComponent;
export const NativeScreenContainer = ScreenContainerComponent;
export const NativeScreenNavigationContainer = ScreenContainerComponent;
export const ScreenContext = React.createContext(undefined);

// Header subviews
export const ScreenStackHeaderBackButtonImage = () => null;
export const ScreenStackHeaderRightView = (props) => <View>{props.children}</View>;
export const ScreenStackHeaderLeftView = (props) => <View>{props.children}</View>;
export const ScreenStackHeaderCenterView = (props) => <View>{props.children}</View>;
export const ScreenStackHeaderSearchBarView = () => null;
export const SearchBar = () => null;
export const FullWindowOverlay = (props) => <View>{props.children}</View>;

// Gesture handler
export const GHContext = React.createContext(undefined);

// Transition types
export const TransitionType = { Push: 0, Pop: 1 };
export const StackPresentationTypes = {};
export const StackAnimationTypes = {};
export const BlurEffectTypes = {};

// Hooks (no-ops)
export function useTransitionProgress() {
  return { progress: new Animated.Value(1), closing: new Animated.Value(0), goingForward: new Animated.Value(1) };
}

export default ScreenComponent;
