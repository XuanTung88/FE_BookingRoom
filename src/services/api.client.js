import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { clearAuth } from '../utils/storage.util';
 
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});
 
// ── Request interceptor: gắn token ──────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
 
// ── Response interceptor: xử lý 401 ────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
 
export default apiClient;