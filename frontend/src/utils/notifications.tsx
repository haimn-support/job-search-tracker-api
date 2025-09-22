import React from 'react';
import { toast, Toast } from 'react-hot-toast';
import { ApiError } from '../types';
import { getErrorMessage } from './errorMessages';

export interface NotificationOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  style?: React.CSSProperties;
  className?: string;
  icon?: string | React.ReactNode;
  id?: string;
}

export interface ActionableNotificationOptions extends NotificationOptions {
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
}

// Enhanced notification functions
export const notifications = {
  // Success notifications
  success: (message: string, options?: NotificationOptions) => {
    return toast.success(message, {
      duration: options?.duration || 3000,
      position: options?.position || 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
        ...options?.style,
      },
      className: options?.className,
      icon: options?.icon,
      id: options?.id,
    });
  },

  // Error notifications
  error: (message: string | Error | ApiError, options?: NotificationOptions) => {
    let errorMessage = '';
    
    if (typeof message === 'string') {
      errorMessage = message;
    } else if (message instanceof Error) {
      errorMessage = message.message;
    } else {
      const errorInfo = getErrorMessage(message);
      errorMessage = errorInfo.message;
    }

    return toast.error(errorMessage, {
      duration: options?.duration || 5000,
      position: options?.position || 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
        ...options?.style,
      },
      className: options?.className,
      icon: options?.icon,
      id: options?.id,
    });
  },

  // Warning notifications
  warning: (message: string, options?: NotificationOptions) => {
    return toast(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      style: {
        background: '#f59e0b',
        color: '#fff',
        ...options?.style,
      },
      className: options?.className,
      icon: options?.icon || '⚠️',
      id: options?.id,
    });
  },

  // Info notifications
  info: (message: string, options?: NotificationOptions) => {
    return toast(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      style: {
        background: '#3b82f6',
        color: '#fff',
        ...options?.style,
      },
      className: options?.className,
      icon: options?.icon || 'ℹ️',
      id: options?.id,
    });
  },

  // Loading notifications
  loading: (message: string, options?: NotificationOptions) => {
    return toast.loading(message, {
      position: options?.position || 'top-right',
      style: {
        background: '#6b7280',
        color: '#fff',
        ...options?.style,
      },
      className: options?.className,
      id: options?.id,
    });
  },

  // Promise-based notifications
  promise: <T extends any>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: NotificationOptions
  ) => {
    return toast.promise(promise, messages, {
      position: options?.position || 'top-right',
      style: options?.style,
      className: options?.className,
      id: options?.id,
    });
  },

  // Custom notifications with actions
  custom: (
    content: React.ReactNode,
    options?: NotificationOptions
  ) => {
    return toast.custom(content, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      id: options?.id,
    });
  },

  // Dismiss notifications
  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  // Remove specific toast
  remove: (toastId: string) => {
    toast.remove(toastId);
  },
};

// Specialized notification functions for common use cases
export const operationNotifications = {
  // CRUD operation notifications
  created: (resourceName: string, options?: NotificationOptions) => {
    return notifications.success(`${resourceName} created successfully!`, options);
  },

  updated: (resourceName: string, options?: NotificationOptions) => {
    return notifications.success(`${resourceName} updated successfully!`, options);
  },

  deleted: (resourceName: string, options?: NotificationOptions) => {
    return notifications.success(`${resourceName} deleted successfully!`, options);
  },

  saved: (resourceName?: string, options?: NotificationOptions) => {
    const message = resourceName ? `${resourceName} saved!` : 'Changes saved!';
    return notifications.success(message, options);
  },

  // Loading states for operations
  creating: (resourceName: string, options?: NotificationOptions) => {
    return notifications.loading(`Creating ${resourceName.toLowerCase()}...`, options);
  },

  updating: (resourceName: string, options?: NotificationOptions) => {
    return notifications.loading(`Updating ${resourceName.toLowerCase()}...`, options);
  },

  deleting: (resourceName: string, options?: NotificationOptions) => {
    return notifications.loading(`Deleting ${resourceName.toLowerCase()}...`, options);
  },

  loading: (action: string, options?: NotificationOptions) => {
    return notifications.loading(`${action}...`, options);
  },

  // Network status notifications
  offline: (options?: NotificationOptions) => {
    return notifications.warning('You are currently offline. Some features may not work.', {
      duration: Infinity,
      id: 'offline-status',
      ...options,
    });
  },

  online: (options?: NotificationOptions) => {
    notifications.dismiss('offline-status');
    return notifications.success('Connection restored!', {
      duration: 2000,
      ...options,
    });
  },

  // Sync notifications
  syncing: (options?: NotificationOptions) => {
    return notifications.loading('Syncing data...', {
      id: 'sync-status',
      ...options,
    });
  },

  synced: (options?: NotificationOptions) => {
    notifications.dismiss('sync-status');
    return notifications.success('Data synced successfully!', {
      duration: 2000,
      ...options,
    });
  },

  syncError: (error: any, options?: NotificationOptions) => {
    notifications.dismiss('sync-status');
    return notifications.error('Sync failed. Will retry automatically.', options);
  },
};

// Actionable notification component
interface ActionableToastProps {
  message: string;
  actions: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
  onDismiss: () => void;
}

export const ActionableToast: React.FC<ActionableToastProps> = ({ message, actions, onDismiss }) => {
  const getButtonClasses = (style: string = 'secondary') => {
    const baseClasses = 'px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (style) {
      case 'primary':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
      default:
        return `${baseClasses} bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-start">
        <div className="flex-1">
          <p className="text-sm text-gray-900">{message}</p>
          <div className="mt-3 flex space-x-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.action();
                  onDismiss();
                }}
                className={getButtonClasses(action.style)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Hook for using notifications in components
export const useNotifications = () => {
  return {
    ...notifications,
    operations: operationNotifications,
    
    // Convenience method for handling async operations
    handleAsync: async <T extends any>(
      operation: () => Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error?: string | ((error: any) => string);
      }
    ): Promise<T> => {
      const loadingToast = notifications.loading(messages.loading);
      
      try {
        const result = await operation();
        notifications.dismiss(loadingToast);
        
        const successMessage = typeof messages.success === 'function' 
          ? messages.success(result) 
          : messages.success;
        notifications.success(successMessage);
        
        return result;
      } catch (error) {
        notifications.dismiss(loadingToast);
        
        if (messages.error) {
          const errorMessage = typeof messages.error === 'function' 
            ? messages.error(error) 
            : messages.error;
          notifications.error(errorMessage);
        } else {
          notifications.error(error);
        }
        
        throw error;
      }
    },

    // Method for showing actionable notifications
    actionable: (
      message: string,
      actions: Array<{
        label: string;
        action: () => void;
        style?: 'primary' | 'secondary' | 'danger';
      }>,
      options?: NotificationOptions
    ) => {
      return notifications.custom(
        (t) => (
          <ActionableToast
            message={message}
            actions={actions}
            onDismiss={() => toast.dismiss(t.id)}
          />
        ),
        options
      );
    },
  };
};