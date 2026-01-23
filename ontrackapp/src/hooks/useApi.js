import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { axiosWithRetry, fetchWithRetry } from '../services/apiService';

// Create a custom hook for API calls with robust error handling and loading states
const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use ref to track options changes
  const optionsRef = useRef(options);
  const optionsString = JSON.stringify(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const axiosConfig = {
          url,
          method: optionsRef.current.method || 'GET',
          signal: controller.signal,
          ...optionsRef.current,
        };

        const result = await axiosWithRetry(axiosConfig, optionsRef.current.retries || 3);
        setData(result);
      } catch (err) {
        if (err.name === 'AbortError') {
          setError('Request timeout');
        } else if (err.response) {
          // Server responded with error status
          setError(`Server error: ${err.response.status} - ${err.response.data?.message || err.message}`);
        } else if (err.request) {
          // Network error
          setError('Network error - please check your connection');
        } else {
          // Other error
          setError(err.message || 'An unexpected error occurred');
        }
        console.error('API Error:', err);
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [url, optionsString]); // Re-run if url or options change

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    // Trigger re-run by updating a dependency
    setData(null);
  }, []);

  return { data, loading, error, refetch };
};

// Specialized hook for dashboard data with persistent caching
const useDashboardApi = (endpoint) => {
  const [cache, setCache] = useState(() => {
    // Initialize cache from localStorage
    try {
      const stored = localStorage.getItem('dashboardCache');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // If endpoint is null, don't make the API call
  const shouldCallApi = endpoint !== null && endpoint !== undefined;
  const cacheKey = endpoint;

  const { data, loading, error, refetch } = useApi(shouldCallApi ? `/api${endpoint}` : null, {
    retries: 2, // Fewer retries for dashboard to keep it snappy
  });

  // Cache successful responses to both state and localStorage
  useEffect(() => {
    if (data && !error && shouldCallApi) {
      setCache(prevCache => {
        const newCache = {
          ...prevCache,
          [cacheKey]: {
            data,
            timestamp: Date.now(),
          },
        };
        try {
          localStorage.setItem('dashboardCache', JSON.stringify(newCache));
        } catch (e) {
          console.warn('Failed to save dashboard cache to localStorage:', e);
        }
        return newCache;
      });
    }
  }, [data, error, cacheKey, shouldCallApi]);

  // Return cached data if available and recent (within 5 minutes)
  const cachedData = cache[cacheKey];
  const isCacheValid = cachedData && (Date.now() - cachedData.timestamp) < 300000;

  return {
    data: isCacheValid ? cachedData.data : data,
    loading: shouldCallApi ? (loading && !isCacheValid) : false,
    error: shouldCallApi ? error : null,
    refetch,
    isFromCache: isCacheValid,
  };
};

// Specialized hook for public API calls (no authentication required)
const usePublicApi = (endpoint) => {
  const [cache, setCache] = useState(() => {
    // Initialize cache from localStorage
    try {
      const stored = localStorage.getItem('publicApiCache');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // If endpoint is null, don't make the API call
  const shouldCallApi = endpoint !== null && endpoint !== undefined;
  const cacheKey = endpoint;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(shouldCallApi);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shouldCallApi) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use fetchWithRetry for public endpoints (no auth)
        const result = await fetchWithRetry(`/api${endpoint}`);
        setData(result);
      } catch (err) {
        if (err.name === 'AbortError') {
          setError('Request timeout');
        } else {
          setError(err.message || 'An unexpected error occurred');
        }
        console.error('Public API Error:', err);
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [endpoint, shouldCallApi]);

  // Cache successful responses to both state and localStorage
  useEffect(() => {
    if (data && !error && shouldCallApi) {
      setCache(prevCache => {
        const newCache = {
          ...prevCache,
          [cacheKey]: {
            data,
            timestamp: Date.now(),
          },
        };
        try {
          localStorage.setItem('publicApiCache', JSON.stringify(newCache));
        } catch (e) {
          console.warn('Failed to save public API cache to localStorage:', e);
        }
        return newCache;
      });
    }
  }, [data, error, cacheKey, shouldCallApi]);

  // Return cached data if available and recent (within 5 minutes)
  const cachedData = cache[cacheKey];
  const isCacheValid = cachedData && (Date.now() - cachedData.timestamp) < 300000;

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setData(null);
  }, []);

  return {
    data: isCacheValid ? cachedData.data : data,
    loading: shouldCallApi ? (loading && !isCacheValid) : false,
    error: shouldCallApi ? error : null,
    refetch,
    isFromCache: isCacheValid,
  };
};

export { useApi, useDashboardApi, usePublicApi };
export default useApi;
