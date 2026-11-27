import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export const AuthContext = createContext(null);

const RECOVERY_KEY = 'healthledger_recovery';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = async (data) => {
    const { token: t, user: userData, recoveryToken } = data;
    api.defaults.headers.common.Authorization = `Bearer ${t}`;
    await AsyncStorage.setItem('token', t);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    if (recoveryToken) await AsyncStorage.setItem(RECOVERY_KEY, recoveryToken);
    setToken(t);
    setUser(userData);
    return userData;
  };

  useEffect(() => {
    (async () => {
      try {
        const [t, u] = await Promise.all([AsyncStorage.getItem('token'), AsyncStorage.getItem('user')]);
        if (t && u) {
          api.defaults.headers.common.Authorization = `Bearer ${t}`;
          setToken(t);
          setUser(JSON.parse(u));
          // Recreate the account if the backend restarted and lost its registry.
          try {
            await api.get('/api/profile');
          } catch (err) {
            if (err.response?.status === 404) {
              const recovery = await AsyncStorage.getItem(RECOVERY_KEY);
              if (recovery) {
                const res = await api.post('/api/auth/restore', { token: recovery });
                await applySession(res.data);
              }
            }
          }
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (phone, password) => {
    const res = await api.post('/api/auth/login', { phone, password });
    return applySession(res.data);
  };

  const register = async (details) => {
    const res = await api.post('/api/auth/register', details);
    return applySession(res.data);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user', RECOVERY_KEY]);
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
