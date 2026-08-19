import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('token').then(t => {
      AsyncStorage.getItem('user').then(u => {
        if (t && u) {
          api.defaults.headers.common.Authorization = `Bearer ${t}`;
          setToken(t);
          setUser(JSON.parse(u));
        }
        setLoading(false);
      });
    }).catch(() => setLoading(false));
  }, []);

  const login = async (phone, password) => {
    const res = await api.post('/api/auth/login', { phone, password });
    const { token: t, user: userData } = res.data;
    api.defaults.headers.common.Authorization = `Bearer ${t}`;
    await AsyncStorage.setItem('token', t);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(t);
    setUser(userData);
    return userData;
  };

  const register = async (details) => {
    const res = await api.post('/api/auth/register', details);
    const { token: t, user: userData } = res.data;
    api.defaults.headers.common.Authorization = `Bearer ${t}`;
    await AsyncStorage.setItem('token', t);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(t);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
