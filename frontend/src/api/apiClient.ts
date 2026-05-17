import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    try {
      const storage = localStorage.getItem('newave-auth');
      if (storage) {
        const { state } = JSON.parse(storage);
        if (state && state.user && state.user.token) {
          config.headers.Authorization = `Bearer ${state.user.token}`;
        }
      }
    } catch (e) {
      console.warn('Error reading auth state from local storage', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de forma global con el tono cálido
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.friendlyMessage || '¡Ups! Algo no salió como esperábamos. ¿Lo intentamos de nuevo? 🔄';
    console.error(`Error de API: ${message}`);
    return Promise.reject(error);
  }
);

export default apiClient;
