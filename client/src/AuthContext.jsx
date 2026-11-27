import { createContext, useEffect, useState } from 'react';
import api from './api.js';

export const AuthContext = createContext(null);

const RECOVERY_KEY = 'healthledger_recovery';

function applySession(data) {
  const { token, user: userData, recoveryToken } = data;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
  if (recoveryToken) localStorage.setItem(RECOVERY_KEY, recoveryToken);
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
  return userData;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) return;
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(JSON.parse(storedUser));

    // The free backend resets its in-memory registry on redeploy. If the
    // account is gone, silently recreate it from the signed recovery token.
    api.get('/api/profile').catch(async (err) => {
      if (err.response?.status !== 404) return;
      const recovery = localStorage.getItem(RECOVERY_KEY);
      if (!recovery) return;
      try {
        const res = await api.post('/api/auth/restore', { token: recovery });
        setUser(applySession(res.data));
      } catch (e) {
        // ignore — the user can register again manually
      }
    });
  }, []);

  const login = async (phone, password) => {
    const response = await api.post('/api/auth/login', { phone, password });
    return applySession(response.data);
  };

  const register = async (details) => {
    const response = await api.post('/api/auth/register', details);
    return applySession(response.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem(RECOVERY_KEY);
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
