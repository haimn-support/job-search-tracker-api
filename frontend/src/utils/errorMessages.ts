import { ApiError } from '../types';

export interface UserFriendlyError {
  title: string;
  message: string;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  severity: 'info' | 'warning' | 'error' | 'success';
}

// Error code to user-friendly message mapping
const ERROR_MESSAGES: Record<string, Omit<UserFriendlyError, 'actions'>> = {
  // Authentication errors
  INVALID_CREDENTIALS: {
    title: 'Login Failed',
    message: 'The email or password you entered is incorrect. Please try again.',
    severity: 'error',
  },
  TOKEN_EXPIRED: {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again to continue.',
    severity: 'warning',
  },
  UNAUTHORIZED: {
    title: 'Access Denied',
    message: 'You don\'t have permission to access this resource.',
    severity: 'error',
  },

  // Validation errors
  VALIDATION_ERROR: {
    title: 'Invalid Input',
    message: 'Please check your input and correct any errors.',
    severity: 'warning',
  },
  REQUIRED_FIELD: {
    title: 'Missing Information',
    message: 'Please fill in all required fields.',
    severity: 'warning',
  },
  INVALID_EMAIL: {
    title: 'Invalid Email',
    message: 'Please enter a valid email address.',
    severity: 'warning',
  },
  PASSWORD_TOO_WEAK: {
    title: 'Weak Password',
    message: 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers.',
    severity: 'warning',
  },
  EMAIL_ALREADY_EXISTS: {
    title: 'Email Already Registered',
    message: 'An account with this email already exists. Try logging in instead.',
    severity: 'warning',
  },

  // Resource errors
  NOT_FOUND: {
    title: 'Not Found',
    message: 'The requested item could not be found. It may have been deleted or moved.',
    severity: 'error',
  },
  POSITION_NOT_FOUND: {
    title: 'Position Not Found',
    message: 'This position no longer exists. It may have been deleted.',
    severity: 'error',
  },
  INTERVIEW_NOT_FOUND: {
    title: 'Interview Not Found',
    message: 'This interview could not be found. It may have been deleted.',
    severity: 'error',
  },

  // Network and server errors
  NETWORK_ERROR: {
    title: 'Connection Problem',
    message: 'Unable to connect to the server. Please check your internet connection.',
    severity: 'error',
  },
  SERVER_ERROR: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again in a few moments.',
    severity: 'error',
  },
  SERVICE_UNAVAILABLE: {
    title: 'Service Unavailable',
    message: 'The service is temporarily unavailable. Please try again later.',
    severity: 'error',
  },
  RATE_LIMITED: {
    title: 'Too Many Requests',
    message: 'You\'re making requests too quickly. Please wait a moment and try again.',
    severity: 'warning',
  },

  // Data operation errors
  CREATE_FAILED: {
    title: 'Creation Failed',
    message: 'Unable to create the item. Please try again.',
    severity: 'error',
  },
  UPDATE_FAILED: {
    title: 'Update Failed',
    message: 'Unable to save your changes. Please try again.',
    severity: 'error',
  },
  DELETE_FAILED: {
    title: 'Deletion Failed',
    message: 'Unable to delete the item. Please try again.',
    severity: 'error',
  },
  DUPLICATE_ENTRY: {
    title: 'Duplicate Entry',
    message: 'This item already exists. Please check your data.',
    severity: 'warning',
  },

  // File and upload errors
  FILE_TOO_LARGE: {
    title: 'File Too Large',
    message: 'The file you selected is too large. Please choose a smaller file.',
    severity: 'warning',
  },
  INVALID_FILE_TYPE: {
    title: 'Invalid File Type',
    message: 'This file type is not supported. Please choose a different file.',
    severity: 'warning',
  },
  UPLOAD_FAILED: {
    title: 'Upload Failed',
    message: 'Unable to upload the file. Please try again.',
    severity: 'error',
  },

  // Generic fallback
  UNKNOWN_ERROR: {
    title: 'Unexpected Error',
    message: 'Something unexpected happened. Please try again.',
    severity: 'error',
  },
};

export const getErrorMessage = (error: any): UserFriendlyError => {
  let errorCode = 'UNKNOWN_ERROR';
  let fieldErrors: Record<string, string> = {};

  // Handle ApiError objects
  if (error && typeof error === 'object' && 'code' in error) {
    errorCode = error.code;
    fieldErrors = error.field_errors || {};
  }
  // Handle HTTP response errors
  else if (error?.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (data?.code) {
      errorCode = data.code;
      fieldErrors = data.field_errors || {};
    } else {
      // Map HTTP status codes to error codes
      switch (status) {
        case 400:
          errorCode = 'VALIDATION_ERROR';
          break;
        case 401:
          errorCode = 'UNAUTHORIZED';
          break;
        case 404:
          errorCode = 'NOT_FOUND';
          break;
        case 422:
          errorCode = 'VALIDATION_ERROR';
          break;
        case 429:
          errorCode = 'RATE_LIMITED';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorCode = 'SERVER_ERROR';
          break;
        default:
          errorCode = 'UNKNOWN_ERROR';
      }
    }
  }
  // Handle network errors
  else if (error && !error.response) {
    errorCode = 'NETWORK_ERROR';
  }

  const baseError = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN_ERROR;

  // Create actions based on error type
  const actions: UserFriendlyError['actions'] = [];

  // Add field-specific error handling
  if (Object.keys(fieldErrors).length > 0) {
    const fieldErrorMessages = Object.entries(fieldErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('\n');
    
    return {
      ...baseError,
      title: 'Validation Error',
      message: fieldErrorMessages,
      actions,
    };
  }

  // Add context-specific actions
  switch (errorCode) {
    case 'TOKEN_EXPIRED':
    case 'UNAUTHORIZED':
      actions.push({
        label: 'Login',
        action: () => window.location.href = '/login',
        variant: 'primary',
      });
      break;

    case 'NOT_FOUND':
    case 'POSITION_NOT_FOUND':
    case 'INTERVIEW_NOT_FOUND':
      actions.push({
        label: 'Go Back',
        action: () => window.history.back(),
        variant: 'secondary',
      });
      actions.push({
        label: 'Go Home',
        action: () => window.location.href = '/',
        variant: 'primary',
      });
      break;

    case 'NETWORK_ERROR':
    case 'SERVER_ERROR':
      actions.push({
        label: 'Retry',
        action: () => window.location.reload(),
        variant: 'primary',
      });
      break;

    case 'SERVICE_UNAVAILABLE':
      actions.push({
        label: 'Check Status',
        action: () => window.open('/status', '_blank'),
        variant: 'secondary',
      });
      break;
  }

  return {
    ...baseError,
    actions,
  };
};

// Specialized error message functions
export const getFormErrorMessage = (error: any, formType: string): UserFriendlyError => {
  const baseError = getErrorMessage(error);
  
  // Customize message based on form type
  switch (formType) {
    case 'login':
      if (error?.code === 'VALIDATION_ERROR') {
        return {
          ...baseError,
          title: 'Login Error',
          message: 'Please check your email and password.',
        };
      }
      break;
    
    case 'register':
      if (error?.code === 'VALIDATION_ERROR') {
        return {
          ...baseError,
          title: 'Registration Error',
          message: 'Please check your information and try again.',
        };
      }
      break;
    
    case 'position':
      if (error?.code === 'VALIDATION_ERROR') {
        return {
          ...baseError,
          title: 'Position Error',
          message: 'Please check the position details and try again.',
        };
      }
      break;
    
    case 'interview':
      if (error?.code === 'VALIDATION_ERROR') {
        return {
          ...baseError,
          title: 'Interview Error',
          message: 'Please check the interview details and try again.',
        };
      }
      break;
  }
  
  return baseError;
};

export const getNetworkErrorMessage = (): UserFriendlyError => {
  return {
    title: 'Connection Lost',
    message: 'You appear to be offline. Some features may not work until your connection is restored.',
    severity: 'warning',
    actions: [
      {
        label: 'Retry',
        action: () => window.location.reload(),
        variant: 'primary',
      },
    ],
  };
};

export const getLoadingErrorMessage = (resource: string): UserFriendlyError => {
  return {
    title: `Failed to Load ${resource}`,
    message: `We couldn't load your ${resource.toLowerCase()}. This might be a temporary issue.`,
    severity: 'error',
    actions: [
      {
        label: 'Try Again',
        action: () => window.location.reload(),
        variant: 'primary',
      },
    ],
  };
};

// Error message formatting utilities
export const formatFieldErrors = (fieldErrors: Record<string, string>): string => {
  return Object.entries(fieldErrors)
    .map(([field, message]) => {
      const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `${fieldName}: ${message}`;
    })
    .join('\n');
};

export const getErrorSeverityColor = (severity: UserFriendlyError['severity']): string => {
  switch (severity) {
    case 'error':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'info':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'success':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};