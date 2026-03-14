'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  /** Set auth state (token + user) after professional registration or OTP login */
  const setAuth = useCallback((token, userData) => {
    if (token) localStorage.setItem('token', token);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    setUser(null);
    router.push('/login');
  }, [router]);

  /** Admin/Professional login (email + password) */
  const loginAdmin = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login-admin', { email, password });
    setAuth(data.token, data.user);
    return data.user;
  }, [setAuth]);

  /** Professional OTP login - step 2: verify OTP and get token */
  const verifyLoginOtp = useCallback(async (email, otp) => {
    const { data } = await api.post('/auth/verify-login', { email, otp });
    setAuth(data.token, data.user);
    return data.user;
  }, [setAuth]);

  /** Legacy alias: login with email/password (admin only) */
  const login = useCallback(async (email, password) => {
    return loginAdmin(email, password);
  }, [loginAdmin]);

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    setAuth(data.token, data.user);
    return data.user;
  }, [setAuth]);

  /** --- Session Management (Inactivity Timeout) --- **/
  
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
    const CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    const checkInactivity = () => {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0', 10);
      if (lastActivity && Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        console.log('[Auth] Session timed out due to inactivity');
        logout();
      }
    };

    // Initialize lastActivity if not present
    if (!localStorage.getItem('lastActivity')) updateActivity();

    // Listen for common user interactions
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }));

    // Periodic check for timeout
    const intervalId = setInterval(checkInactivity, CHECK_INTERVAL);

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      clearInterval(intervalId);
    };
  }, [user, logout]);

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
