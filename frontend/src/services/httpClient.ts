import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { ApiError } from '../types';
import { tokenManager } from '../utils/tokenManager';
import { OfflineQueue } from '../utils/offlineQueue';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { retryApiCall, defaultRetryConfig } from '../utils/retryMechanism';

// Create axios instance with base configuration
const createHttpClient = (): AxiosInstance => {
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  
  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for authentication and performance tracking
  client.interceptors.request.use(
    (config) => {
      const authHeader = tokenManager.getAuthHeader();
      if (authHeader) {
        config.headers.Authorization = authHeader;
      }
      
      // Add performance tracking metadata
      config.metadata = {
        startTime: performance.now(),
        performanceId: `${config.method?.toUpperCase()}_${config.url}`,
      };
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling, token refresh, and performance tracking
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Track successful request performance
      const config = response.config as any;
      if (config.metadata?.startTime && config.metadata?.performanceId) {
        const duration = performance.now() - config.metadata.startTime;
        
        PerformanceMonitor.addEntry({
          name: config.metadata.performanceId,
          startTime: config.metadata.startTime,
          duration,
          type: 'network',
          metadata: {
            url: config.url,
            method: config.method,
            status: response.status,
            size: JSON.stringify(response.data).length,
          },
        });
      }
      
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; metadata?: any };

      // Track failed request performance
      if (originalRequest?.metadata?.startTime && originalRequest?.metadata?.performanceId) {
        const duration = performance.now() - originalRequest.metadata.startTime;
        
        PerformanceMonitor.addEntry({
          name: originalRequest.metadata.performanceId,
          startTime: originalRequest.metadata.startTime,
          duration,
          type: 'network',
          metadata: {
            url: originalRequest.url,
            method: originalRequest.method,
            status: error.response?.status || 0,
            error: error.message,
          },
        });
      }

      // Handle network errors - add to offline queue if appropriate
      if (!error.response && !navigator.onLine) {
        // Only queue mutations (POST, PUT, PATCH, DELETE)
        const mutationMethods = ['post', 'put', 'patch', 'delete'];
        if (originalRequest && mutationMethods.includes(originalRequest.method?.toLowerCase() || '')) {
          // Determine resource type and operation type
          const url = originalRequest.url || '';
          let resource: 'position' | 'interview' = 'position';
          let type: 'create' | 'update' | 'delete' = 'create';
          
          if (url.includes('interview')) {
            resource = 'interview';
          }
          
          if (originalRequest.method?.toLowerCase() === 'put' || originalRequest.method?.toLowerCase() === 'patch') {
            type = 'update';
          } else if (originalRequest.method?.toLowerCase() === 'delete') {
            type = 'delete';
          }
          
          OfflineQueue.addToQueue({
            type,
            resource,
            data: originalRequest.data ? JSON.parse(originalRequest.data) : null,
            url: `${originalRequest.baseURL}${originalRequest.url}`,
            method: originalRequest.method?.toUpperCase() || 'POST',
            headers: originalRequest.headers as Record<string, string>,
          });
          
          toast.error('You are offline. Request has been queued for when you reconnect.');
          
          // Return a resolved promise with a placeholder response for optimistic updates
          return Promise.resolve({
            data: { id: `offline-${Date.now()}`, ...originalRequest.data },
            status: 202,
            statusText: 'Queued',
            headers: {},
            config: originalRequest,
          } as AxiosResponse);
        }
      }

      // Handle 401 errors (unauthorized)
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = tokenManager.getRefreshToken();
          if (refreshToken) {
            const response = await axios.post(`${baseURL}/auth/refresh`, {
              refresh_token: refreshToken,
            });

            const { access_token, expires_in } = response.data;
            tokenManager.updateAccessToken(access_token, expires_in);

            // Retry the original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          tokenManager.clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // Transform error response to standardized format
      const responseData = error.response?.data as any;
      const apiError: ApiError = {
        code: responseData?.code || 'UNKNOWN_ERROR',
        message: responseData?.message || error.message || 'An unexpected error occurred',
        field_errors: responseData?.field_errors,
        timestamp: new Date().toISOString(),
      };

      // Don't show toast for certain error codes
      const silentErrors = ['VALIDATION_ERROR', 'NOT_FOUND'];
      if (!silentErrors.includes(apiError.code) && error.response?.status !== 401) {
        toast.error(apiError.message);
      }

      return Promise.reject(apiError);
    }
  );

  return client;
};

// Create and export the HTTP client instance
export const httpClient = createHttpClient();

// Enhanced utility functions for common HTTP operations with performance tracking and retry
export const apiRequest = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const endMeasurement = PerformanceMonitor.startMeasurement(`GET ${url}`, 'network');
    
    return retryApiCall(() => httpClient.get(url, config), {
      ...defaultRetryConfig,
      onRetry: (attempt, error) => {
        console.warn(`Retrying GET ${url} (attempt ${attempt}):`, error.message);
      },
    })
      .then((response) => {
        endMeasurement();
        return response.data;
      })
      .catch((error) => {
        endMeasurement();
        throw error;
      });
  },

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const endMeasurement = PerformanceMonitor.startMeasurement(`POST ${url}`, 'network');
    
    return retryApiCall(() => httpClient.post(url, data, config), {
      ...defaultRetryConfig,
      // Be more conservative with POST retries
      maxRetries: 2,
      onRetry: (attempt, error) => {
        console.warn(`Retrying POST ${url} (attempt ${attempt}):`, error.message);
      },
    })
      .then((response) => {
        endMeasurement();
        return response.data;
      })
      .catch((error) => {
        endMeasurement();
        throw error;
      });
  },

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const endMeasurement = PerformanceMonitor.startMeasurement(`PUT ${url}`, 'network');
    
    return retryApiCall(() => httpClient.put(url, data, config), {
      ...defaultRetryConfig,
      maxRetries: 2,
      onRetry: (attempt, error) => {
        console.warn(`Retrying PUT ${url} (attempt ${attempt}):`, error.message);
      },
    })
      .then((response) => {
        endMeasurement();
        return response.data;
      })
      .catch((error) => {
        endMeasurement();
        throw error;
      });
  },

  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const endMeasurement = PerformanceMonitor.startMeasurement(`PATCH ${url}`, 'network');
    
    return retryApiCall(() => httpClient.patch(url, data, config), {
      ...defaultRetryConfig,
      maxRetries: 2,
      onRetry: (attempt, error) => {
        console.warn(`Retrying PATCH ${url} (attempt ${attempt}):`, error.message);
      },
    })
      .then((response) => {
        endMeasurement();
        return response.data;
      })
      .catch((error) => {
        endMeasurement();
        throw error;
      });
  },

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const endMeasurement = PerformanceMonitor.startMeasurement(`DELETE ${url}`, 'network');
    
    return retryApiCall(() => httpClient.delete(url, config), {
      ...defaultRetryConfig,
      maxRetries: 2,
      onRetry: (attempt, error) => {
        console.warn(`Retrying DELETE ${url} (attempt ${attempt}):`, error.message);
      },
    })
      .then((response) => {
        endMeasurement();
        return response.data;
      })
      .catch((error) => {
        endMeasurement();
        throw error;
      });
  },
};

// Re-export tokenManager for backward compatibility
export { tokenManager };

export default httpClient;