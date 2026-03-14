import axios from 'axios';

const getBaseURL = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginPath = typeof window !== 'undefined' && (
      window.location.pathname === '/login' ||
      error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/verify-login') ||
      error.config?.url?.includes('/auth/login-admin')
    );

    if (error.response?.status === 401 && typeof window !== 'undefined' && !isLoginPath) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
