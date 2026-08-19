import { createContext, useEffect, useState } from 'react';
import api from './api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (phone, password) => {
    const response = await api.post('/api/auth/login', { phone, password });
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(userData);
    return userData;
  };

  const register = async (details) => {
    const response = await api.post('/api/auth/register', details);
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
