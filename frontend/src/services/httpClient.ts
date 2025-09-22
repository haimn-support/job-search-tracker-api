import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiError } from '../types';
import { tokenManager } from '../utils/tokenManager';

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
      const authHeader = tokenManager.getAuthHeader();
      if (authHeader) {
        config.headers.Authorization = authHeader;
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

// Re-export tokenManager for backward compatibility
export { tokenManager };

export default httpClient;