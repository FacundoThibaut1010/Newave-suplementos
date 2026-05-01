import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
