import { ApiError } from '../types';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryCondition: (error: any) => {
    // Retry on network errors or 5xx server errors
    if (!error.response) return true; // Network error
    const status = error.response?.status || error.status;
    return status >= 500 && status < 600;
  },
};

export class RetryableError extends Error {
  public readonly originalError: any;
  public readonly attempt: number;
  public readonly maxRetries: number;

  constructor(originalError: any, attempt: number, maxRetries: number) {
    super(`Retry attempt ${attempt}/${maxRetries} failed: ${originalError.message}`);
    this.name = 'RetryableError';
    this.originalError = originalError;
    this.attempt = attempt;
    this.maxRetries = maxRetries;
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config };
  let lastError: any;

  for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt > finalConfig.maxRetries) {
        break;
      }

      // Check if we should retry this error
      if (finalConfig.retryCondition && !finalConfig.retryCondition(error)) {
        break;
      }

      // Call retry callback if provided
      if (finalConfig.onRetry) {
        finalConfig.onRetry(attempt, error);
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt - 1),
        finalConfig.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;

      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }

  throw new RetryableError(lastError, finalConfig.maxRetries + 1, finalConfig.maxRetries);
}

// Specialized retry functions for different scenarios
export const retryApiCall = <T>(
  apiCall: () => Promise<T>,
  options: Partial<RetryConfig> = {}
): Promise<T> => {
  return withRetry(apiCall, {
    ...defaultRetryConfig,
    retryCondition: (error: any) => {
      // Don't retry client errors (4xx) except for 408, 429
      if (error.response?.status) {
        const status = error.response.status;
        if (status >= 400 && status < 500) {
          return status === 408 || status === 429; // Timeout or Rate Limited
        }
      }
      // Retry network errors and server errors
      return !error.response || (error.response.status >= 500);
    },
    onRetry: (attempt, error) => {
      console.warn(`API call retry attempt ${attempt}:`, error.message);
    },
    ...options,
  });
};

export const retryWithExponentialBackoff = <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  return withRetry(operation, {
    maxRetries,
    baseDelay: 1000,
    backoffFactor: 2,
    maxDelay: 30000,
  });
};

export const retryNetworkOperation = <T>(
  operation: () => Promise<T>,
  options: Partial<RetryConfig> = {}
): Promise<T> => {
  return withRetry(operation, {
    maxRetries: 5,
    baseDelay: 2000,
    backoffFactor: 1.5,
    maxDelay: 15000,
    retryCondition: (error: any) => {
      // Only retry on network errors
      return !error.response;
    },
    ...options,
  });
};

// Hook for using retry mechanism in React components
export const useRetry = () => {
  const retry = async <T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<T> => {
    return withRetry(operation, config);
  };

  const retryApi = async <T>(
    apiCall: () => Promise<T>,
    options?: Partial<RetryConfig>
  ): Promise<T> => {
    return retryApiCall(apiCall, options);
  };

  return { retry, retryApi };
};

// Error recovery utilities
export const createRecoveryActions = (error: any) => {
  const actions: Array<{ label: string; action: () => void }> = [];

  // Add refresh action for network errors
  if (!error.response) {
    actions.push({
      label: 'Refresh Page',
      action: () => window.location.reload(),
    });
  }

  // Add retry action for retryable errors
  if (error instanceof RetryableError || error.response?.status >= 500) {
    actions.push({
      label: 'Try Again',
      action: () => {
        // This would need to be implemented by the calling component
        console.log('Retry action triggered');
      },
    });
  }

  // Add navigation actions for certain errors
  if (error.response?.status === 404) {
    actions.push({
      label: 'Go Home',
      action: () => window.location.href = '/',
    });
  }

  if (error.response?.status === 401) {
    actions.push({
      label: 'Login',
      action: () => window.location.href = '/login',
    });
  }

  return actions;
};

// Error classification utility
export const classifyError = (error: any): {
  type: 'network' | 'client' | 'server' | 'validation' | 'authentication' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  userMessage: string;
} => {
  // Network errors
  if (!error.response) {
    return {
      type: 'network',
      severity: 'medium',
      recoverable: true,
      userMessage: 'Network connection issue. Please check your internet connection and try again.',
    };
  }

  const status = error.response.status;

  // Authentication errors
  if (status === 401) {
    return {
      type: 'authentication',
      severity: 'high',
      recoverable: true,
      userMessage: 'Your session has expired. Please log in again.',
    };
  }

  // Validation errors
  if (status === 400 || status === 422) {
    return {
      type: 'validation',
      severity: 'low',
      recoverable: true,
      userMessage: 'Please check your input and try again.',
    };
  }

  // Client errors
  if (status >= 400 && status < 500) {
    return {
      type: 'client',
      severity: status === 404 ? 'medium' : 'low',
      recoverable: status === 404 || status === 403,
      userMessage: status === 404 
        ? 'The requested resource was not found.'
        : 'There was an issue with your request.',
    };
  }

  // Server errors
  if (status >= 500) {
    return {
      type: 'server',
      severity: 'high',
      recoverable: true,
      userMessage: 'Server error. Please try again in a few moments.',
    };
  }

  // Unknown errors
  return {
    type: 'unknown',
    severity: 'medium',
    recoverable: true,
    userMessage: 'An unexpected error occurred. Please try again.',
  };
};