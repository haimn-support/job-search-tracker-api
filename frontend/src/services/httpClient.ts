import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiError, AuthResponse } from '../types';

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

  // Request interceptor for authentication
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and token refresh
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Handle 401 errors (unauthorized)
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const response = await axios.post(`${baseURL}/auth/refresh`, {
              refresh_token: refreshToken,
            });

            const { access_token } = response.data;
            localStorage.setItem('access_token', access_token);

            // Retry the original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // Transform error response to standardized format
      const apiError: ApiError = {
        code: error.response?.data?.code || 'UNKNOWN_ERROR',
        message: error.response?.data?.message || error.message || 'An unexpected error occurred',
        field_errors: error.response?.data?.field_errors,
        timestamp: new Date().toISOString(),
      };

      return Promise.reject(apiError);
    }
  );

  return client;
};

// Create and export the HTTP client instance
export const httpClient = createHttpClient();

// Utility functions for common HTTP operations
export const apiRequest = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    httpClient.get(url, config).then((response) => response.data),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    httpClient.post(url, data, config).then((response) => response.data),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    httpClient.put(url, data, config).then((response) => response.data),

  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    httpClient.patch(url, data, config).then((response) => response.data),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    httpClient.delete(url, config).then((response) => response.data),
};

// Token management utilities
export const tokenManager = {
  setTokens: (authResponse: AuthResponse) => {
    localStorage.setItem('access_token', authResponse.access_token);
    localStorage.setItem('user', JSON.stringify(authResponse.user));
    // Note: refresh_token would be set if provided by the API
  },

  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getAccessToken: (): string | null => {
    return localStorage.getItem('access_token');
  },

  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },
};

export default httpClient;