import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  try {
    // Read session directly from localStorage
    const storedSession = localStorage.getItem('care4u-auth');
    
    if (storedSession) {
      const session = JSON.parse(storedSession);
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    }
  } catch (error) {
    console.error('Error getting session from localStorage:', error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

