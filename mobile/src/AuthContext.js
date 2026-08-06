import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = global.localStorage?.getItem?.('token') || null;
    const storedUser = global.localStorage?.getItem?.('user') || null;
    if (token && storedUser) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (phone, password) => {
    const response = await axios.post('http://10.0.2.2:4000/api/auth/login', { phone, password });
    const { token, user: userData } = response.data;
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    try { global.localStorage.setItem('token', token); global.localStorage.setItem('user', JSON.stringify(userData)); } catch (e) {}
    setUser(userData);
    return userData;
  };

  const register = async (details) => {
    const response = await axios.post('http://10.0.2.2:4000/api/auth/register', details);
    const { token, user: userData } = response.data;
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    try { global.localStorage.setItem('token', token); global.localStorage.setItem('user', JSON.stringify(userData)); } catch (e) {}
    setUser(userData);
    return userData;
  };

  const logout = () => {
    try { global.localStorage.removeItem('token'); global.localStorage.removeItem('user'); } catch (e) {}
    delete axios.defaults.headers.common.Authorization;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
