'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  /** Set auth state (token + user) after professional registration or OTP login */
  const setAuth = (token, userData) => {
    if (token) localStorage.setItem('token', token);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  /** Admin login (email + password) */
  const loginAdmin = async (email, password) => {
    const { data } = await api.post('/auth/login-admin', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  /** Professional OTP login - step 2: verify OTP and get token */
  const verifyLoginOtp = async (email, otp) => {
    const { data } = await api.post('/auth/verify-login', { email, otp });
    setAuth(data.token, data.user);
    return data.user;
  };

  /** Legacy alias: login with email/password (admin only) */
  const login = async (email, password) => {
    return loginAdmin(email, password);
  };

  /** Legacy: register with email/password (admin only) */
  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    setAuth(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginAdmin,
        verifyLoginOtp,
        register,
        setAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
