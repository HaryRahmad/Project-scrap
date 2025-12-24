import axios from 'axios';
import useAuthStore from '../store';

const api = axios.create({
  baseURL: '/api'
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me')
};

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
};

export const stockApi = {
  get: () => api.get('/stock'),
  getAll: () => api.get('/stock/all')
};

export const locationApi = {
  getAll: () => api.get('/locations')
};

export default api;
