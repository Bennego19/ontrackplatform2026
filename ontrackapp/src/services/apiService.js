// API service with retry logic for robust efficiency
import axios from 'axios';

// Create an API service with retry logic
export const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        ...options,
        timeout: 10000, // 10 second timeout
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

// Enhanced axios instance with default retry configuration
export const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    return Promise.reject(error);
  }
);

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

export default apiClient;
