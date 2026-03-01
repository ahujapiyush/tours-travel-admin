import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { authAPI } from '../services/api';

let SecureStore;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}
import socketService from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      let storedToken;
      if (Platform.OS === 'web') {
        storedToken = localStorage.getItem('auth_token');
      } else {
        storedToken = await SecureStore.getItemAsync('auth_token');
      }

      if (storedToken) {
        setToken(storedToken);
        const { data } = await authAPI.getProfile();
        setUser(data.user);
        socketService.connect(storedToken);
      }
    } catch (error) {
      console.error('Auth load error:', error.message);
      await clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const storeToken = async (newToken) => {
    if (Platform.OS === 'web') {
      localStorage.setItem('auth_token', newToken);
    } else {
      await SecureStore.setItemAsync('auth_token', newToken);
    }
  };

  const clearAuth = async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('auth_token');
    } else {
      await SecureStore.deleteItemAsync('auth_token');
    }
    setUser(null);
    setToken(null);
    socketService.disconnect();
  };

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    if (data.user.role !== 'admin') {
      throw new Error('Access denied. Admin privileges required.');
    }
    await storeToken(data.token);
    setToken(data.token);
    setUser(data.user);
    socketService.connect(data.token);
    return data;
  };

  const logout = async () => {
    await clearAuth();
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, updateUser, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
