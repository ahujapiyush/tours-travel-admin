import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { COLORS } from './src/constants/theme';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';

// Tab Screens
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import CarsScreen from './src/screens/cars/CarsScreen';
import BookingsScreen from './src/screens/bookings/BookingsScreen';
import CustomersScreen from './src/screens/customers/CustomersScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';

// Stack Screens
import AddCarScreen from './src/screens/cars/AddCarScreen';
import CarDetailScreen from './src/screens/cars/CarDetailScreen';
import BookingDetailScreen from './src/screens/bookings/BookingDetailScreen';
import LiveMapScreen from './src/screens/maps/LiveMapScreen';
import ReportsScreen from './src/screens/reports/ReportsScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import DriversScreen from './src/screens/drivers/DriversScreen';
import AddCustomerScreen from './src/screens/customers/AddCustomerScreen';
import AddBookingScreen from './src/screens/bookings/AddBookingScreen';
import AddDriverScreen from './src/screens/drivers/AddDriverScreen';

// Web Components
import WebSidebar from './src/components/WebSidebar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const isWeb = Platform.OS === 'web';

function getTabIcon(routeName, focused) {
  const icons = {
    Dashboard: focused ? 'grid' : 'grid-outline',
    Cars: focused ? 'car-sport' : 'car-sport-outline',
    Bookings: focused ? 'calendar' : 'calendar-outline',
    Customers: focused ? 'people' : 'people-outline',
    More: focused ? 'menu' : 'menu-outline',
  };
  return icons[routeName] || 'ellipse';
}

/* ── Mobile Bottom Tab Navigator ── */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => (
          <Ionicons name={getTabIcon(route.name, focused)} size={22} color={color} />
        ),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.divider,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.textWhite,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Cars" component={CarsScreen} options={{ title: 'Cars' }} />
      <Tab.Screen name="Bookings" component={BookingsScreen} options={{ title: 'Bookings' }} />
      <Tab.Screen name="Customers" component={CustomersScreen} options={{ title: 'Customers' }} />
      <Tab.Screen name="More" component={SettingsScreen} options={{ title: 'More' }} />
    </Tab.Navigator>
  );
}

/* ── Web Sidebar Layout ── */
const SCREEN_MAP = {
  Dashboard: DashboardScreen,
  Cars: CarsScreen,
  Bookings: BookingsScreen,
  Customers: CustomersScreen,
  More: SettingsScreen,
  Drivers: DriversScreen,
  LiveMap: LiveMapScreen,
  Reports: ReportsScreen,
  Notifications: NotificationsScreen,
};

const SCREEN_PATHS = {
  Dashboard: '/dashboard',
  Cars: '/cars',
  Bookings: '/bookings',
  Customers: '/customers',
  More: '/settings',
  Drivers: '/drivers',
  LiveMap: '/live-map',
  Reports: '/reports',
  Notifications: '/notifications',
};

const PATH_TO_SCREEN = Object.entries(SCREEN_PATHS).reduce((acc, [screen, path]) => {
  acc[path] = screen;
  return acc;
}, {});

function WebLayout() {
  const [activeScreen, setActiveScreen] = useState('Dashboard');
  const [screenStack, setScreenStack] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = (screen, params) => {
    // Check if this is a main nav item
    if (SCREEN_MAP[screen]) {
      setActiveScreen(screen);
      setScreenStack([]);
      if (typeof window !== 'undefined') {
        const path = SCREEN_PATHS[screen] || '/dashboard';
        if (window.location.pathname !== path) {
          window.history.pushState({}, '', path);
        }
      }
    } else {
      // Push to detail stack
      setScreenStack(prev => [...prev, { screen, params }]);
      // Update URL for detail screens
      if (typeof window !== 'undefined') {
        const detailPaths = {
          BookingDetail: `/bookings/${params?.id || params?.bookingId || ''}`,
          CarDetail: `/cars/${params?.carId || params?.id || ''}`,
          AddCar: '/cars/new',
          AddBooking: '/bookings/new',
          AddCustomer: '/customers/new',
          AddDriver: '/drivers/new',
        };
        const path = detailPaths[screen];
        if (path) window.history.pushState({ screen, params }, '', path);
      }
    }
  };

  const goBack = () => {
    setScreenStack(prev => {
      // If popping an "Add" screen, bump refreshKey to force list re-fetch
      const top = prev[prev.length - 1];
      if (top?.screen?.startsWith('Add')) setRefreshKey(k => k + 1);
      return prev.slice(0, -1);
    });
    // Push the parent screen URL
    if (typeof window !== 'undefined') {
      const path = SCREEN_PATHS[activeScreen] || '/dashboard';
      window.history.pushState({}, '', path);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromPath = () => {
      const path = window.location.pathname;

      // Check detail screen routes first
      const bookingMatch = path.match(/^\/bookings\/([\w-]+)$/);
      const carMatch = path.match(/^\/cars\/([\w-]+)$/);

      if (bookingMatch && bookingMatch[1] !== 'new') {
        setActiveScreen('Bookings');
        setScreenStack([{ screen: 'BookingDetail', params: { id: bookingMatch[1] } }]);
        return;
      }
      if (bookingMatch && bookingMatch[1] === 'new') {
        setActiveScreen('Bookings');
        setScreenStack([{ screen: 'AddBooking', params: {} }]);
        return;
      }
      if (carMatch && carMatch[1] !== 'new') {
        setActiveScreen('Cars');
        setScreenStack([{ screen: 'CarDetail', params: { carId: carMatch[1] } }]);
        return;
      }
      if (carMatch && carMatch[1] === 'new') {
        setActiveScreen('Cars');
        setScreenStack([{ screen: 'AddCar', params: {} }]);
        return;
      }
      if (path === '/customers/new') {
        setActiveScreen('Customers');
        setScreenStack([{ screen: 'AddCustomer', params: {} }]);
        return;
      }
      if (path === '/drivers/new') {
        setActiveScreen('Drivers');
        setScreenStack([{ screen: 'AddDriver', params: {} }]);
        return;
      }

      // Main nav screens
      const matchedScreen = PATH_TO_SCREEN[path];
      if (matchedScreen && SCREEN_MAP[matchedScreen]) {
        setActiveScreen(matchedScreen);
        setScreenStack([]);
      }
    };

    syncFromPath();
    window.addEventListener('popstate', syncFromPath);
    return () => window.removeEventListener('popstate', syncFromPath);
  }, []);

  // Navigation object for screen components
  const navigation = {
    navigate: (screen, params) => navigate(screen, params),
    goBack,
    setOptions: () => {},
  };

  // Determine which screen to render
  let CurrentScreen;
  let currentParams = {};

  if (screenStack.length > 0) {
    const top = screenStack[screenStack.length - 1];
    const detailScreens = {
      AddCar: AddCarScreen,
      CarDetail: CarDetailScreen,
      BookingDetail: BookingDetailScreen,
      AddCustomer: AddCustomerScreen,
      AddBooking: AddBookingScreen,
      AddDriver: AddDriverScreen,
    };
    CurrentScreen = detailScreens[top.screen] || SCREEN_MAP[activeScreen];
    currentParams = top.params || {};
  } else {
    CurrentScreen = SCREEN_MAP[activeScreen] || DashboardScreen;
  }

  return (
    <View style={webStyles.layout}>
      <WebSidebar activeScreen={activeScreen} onNavigate={(s) => navigate(s)} />
      <View style={webStyles.main}>
        {/* Top header bar on web */}
        <View style={webStyles.topBar}>
          {screenStack.length > 0 && (
            <Ionicons
              name="arrow-back"
              size={22}
              color={COLORS.text}
              onPress={goBack}
              style={{ marginRight: 12, cursor: 'pointer' }}
            />
          )}
          <View style={webStyles.topBarTitle}>
            <Ionicons name="ellipse" size={8} color={COLORS.primary} style={{ marginRight: 8 }} />
            <StatusBar style="dark" />
          </View>
        </View>
        <View style={webStyles.content}>
          <CurrentScreen
            key={screenStack.length === 0 ? `${activeScreen}-${refreshKey}` : undefined}
            navigation={navigation}
            route={{ params: currentParams }}
          />
        </View>
      </View>
    </View>
  );
}

/* ── Native Stack Navigator (mobile) ── */
function MobileAppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.textWhite,
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitleVisible: false,
      }}
    >
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="AddCar" component={AddCarScreen} options={{ title: 'Add Car' }} />
          <Stack.Screen name="CarDetail" component={CarDetailScreen} options={{ title: 'Car Details' }} />
          <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking Details' }} />
          <Stack.Screen name="LiveMap" component={LiveMapScreen} options={{ title: 'Live Map' }} />
          <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
          <Stack.Screen name="Drivers" component={DriversScreen} options={{ title: 'Drivers' }} />
          <Stack.Screen name="AddDriver" component={AddDriverScreen} options={{ title: 'Add Driver' }} />
          <Stack.Screen name="AddCustomer" component={AddCustomerScreen} options={{ title: 'Add Customer' }} />
          <Stack.Screen name="AddBooking" component={AddBookingScreen} options={{ title: 'New Booking' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

/* ── Web App Navigator ── */
function WebAppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <LoginScreen />;

  return <WebLayout />;
}

function AppNavigator() {
  return isWeb ? <WebAppNavigator /> : <MobileAppNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        {isWeb ? (
          <>
            <StatusBar style="dark" />
            <AppNavigator />
          </>
        ) : (
          <NavigationContainer>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        )}
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const webStyles = StyleSheet.create({
  layout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    height: '100%',
  },
  main: {
    flex: 1,
    marginLeft: 250,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topBarTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
    overflow: 'auto',
  },
});
