// src/services/api.js - UPDATED VERSION
import axios from 'axios';

// Get the correct API URL based on environment
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const UPLOADS_BASE_URL = process.env.REACT_APP_UPLOADS_URL || '/uploads';

// Enhanced axios instance with environment-aware base URL
export const apiClient = axios.create({
  baseURL: API_BASE_URL, // ← THIS IS THE KEY CHANGE
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get current environment info for debugging
export const getApiInfo = () => ({
  baseURL: API_BASE_URL,
  uploadsURL: UPLOADS_BASE_URL,
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  nodeEnv: process.env.NODE_ENV,
  frontendDomain: process.env.NODE_ENV === 'development' 
    ? 'localhost:3001' 
    : 'platformontrackconnect.co.za',
  backendDomain: process.env.NODE_ENV === 'development'
    ? 'localhost:3000'
    : 'api.ontrackconnect.co.za'
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${API_BASE_URL}${config.url}`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Error:', error.response?.status, error.message);
    }
    
    return Promise.reject(error);
  }
);

// Create an API service with retry logic (your existing code)
export const fetchWithRetry = async (url, options = {}, retries = 3) => {
  const fullUrl = `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(fullUrl, {
        ...options,
        timeout: 10000,
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.data;
    } catch (error) {
      if (i === retries - 1) throw error;
      // Exponential backoff: wait 1s, 2s, 4s, etc.
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};

// Retry wrapper for axios requests
export const axiosWithRetry = async (axiosConfig, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await apiClient(axiosConfig);
      return response.data;
    } catch (error) {
      if (i === retries - 1) throw error;
      // Only retry on network errors or 5xx server errors
      if (!error.response || error.response.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      } else {
        throw error; // Don't retry client errors
      }
    }
  }
};

// Helper for uploads
export const getUploadUrl = (path) => {
  return `${UPLOADS_BASE_URL}/${path}`;
};

export default apiClient;