import axios from 'axios';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

console.log('[api.ts] Initializing API client with base URL:', API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  console.log('[api.ts] Request interceptor: Making request to', config.url);
  try {
    // Read session directly from localStorage instead of calling getSession() which hangs
    const storedSession = localStorage.getItem('care4u-auth');
    console.log('[api.ts] Request interceptor: Stored session exists:', !!storedSession);
    
    if (storedSession) {
      const session = JSON.parse(storedSession);
      if (session?.access_token) {
        console.log('[api.ts] Request interceptor: Adding auth token from localStorage');
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } else {
      console.log('[api.ts] Request interceptor: No stored session, making unauthenticated request');
    }
  } catch (error) {
    console.error('[api.ts] Request interceptor: Error getting session from localStorage:', error);
  }
  console.log('[api.ts] Request interceptor: Proceeding with request');
  return config;
}, (error) => {
  console.error('[api.ts] Request interceptor: Error:', error);
  return Promise.reject(error);
});

// Handle errors
api.interceptors.response.use(
  (response) => {
    console.log('[api.ts] Response interceptor: Successful response from', response.config.url, ':', response.status);
    return response;
  },
  (error) => {
    console.error('[api.ts] Response interceptor: Error response:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    if (error.response?.status === 401) {
      console.log('[api.ts] Response interceptor: 401 Unauthorized, redirecting to login');
      // Redirect to login if unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

