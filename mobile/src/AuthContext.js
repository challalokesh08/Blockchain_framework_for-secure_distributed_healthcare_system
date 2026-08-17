import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from './api';
import axios from 'axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('token').then(storedToken => {
      AsyncStorage.getItem('user').then(storedUser => {
        if (storedToken && storedUser) {
          axios.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
        setLoading(false);
      });
    }).catch(() => setLoading(false));
  }, []);

  const loginUser = async (phone, password) => {
    const response = await axios.post(`${API_BASE}/auth/login`, { phone, password });
    const { token: newToken, user: userData } = response.data;
    axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const registerUser = async (details) => {
    const response = await axios.post(`${API_BASE}/auth/register`, details);
    const { token: newToken, user: userData } = response.data;
    axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    delete axios.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login: loginUser, register: registerUser, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
