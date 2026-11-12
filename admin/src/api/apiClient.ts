import axios from 'axios';

export const ADMIN_TOKEN_KEY = 'newaveAdminToken';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cada pedido al backend lleva el token del panel
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el token venció o no es válido, volvemos al login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/admin/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      if (!window.location.hash.startsWith('#/login')) {
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

// true si hay un token guardado y todavía no venció
export const hasValidAdminToken = () => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export default apiClient;
