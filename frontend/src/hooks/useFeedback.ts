import { useState, useCallback } from 'react';
import { useNotifications } from '../utils/notifications';
import { useSuccessConfirmation } from '../components/ui/SuccessConfirmation';

interface FeedbackState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

interface AsyncOperationOptions {
  loadingMessage?: string;
  successMessage?: string | ((result: any) => string);
  errorMessage?: string | ((error: any) => string);
  showSuccessConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationActions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
}

export const useFeedback = () => {
  const [state, setState] = useState<FeedbackState>({
    loading: false,
    error: null,
    success: null,
  });

  const notifications = useNotifications();
  const { showConfirmation } = useSuccessConfirmation();

  const setLoading = useCallback((loading: boolean, message?: string) => {
    setState(prev => ({ ...prev, loading, error: null, success: null }));
    if (loading && message) {
      notifications.loading(message);
    }
  }, [notifications]);

  const setError = useCallback((error: string | Error | null) => {
    const errorMessage = error instanceof Error ? error.message : error;
    setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    if (error) {
      notifications.error(error);
    }
  }, [notifications]);

  const setSuccess = useCallback((message: string | null) => {
    setState(prev => ({ ...prev, loading: false, success: message, error: null }));
    if (message) {
      notifications.success(message);
    }
  }, [notifications]);

  const clearFeedback = useCallback(() => {
    setState({ loading: false, error: null, success: null });
  }, []);

  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    options: AsyncOperationOptions = {}
  ): Promise<T> => {
    const {
      loadingMessage = 'Processing...',
      successMessage = 'Operation completed successfully!',
      errorMessage,
      showSuccessConfirmation = false,
      confirmationTitle = 'Success',
      confirmationActions,
    } = options;

    try {
      setLoading(true, loadingMessage);
      
      const result = await operation();
      
      const finalSuccessMessage = typeof successMessage === 'function' 
        ? successMessage(result) 
        : successMessage;

      if (showSuccessConfirmation) {
        showConfirmation(
          confirmationTitle,
          finalSuccessMessage,
          confirmationActions
        );
      } else {
        setSuccess(finalSuccessMessage);
      }

      return result;
    } catch (error) {
      const finalErrorMessage = errorMessage
        ? typeof errorMessage === 'function'
          ? errorMessage(error)
          : errorMessage
        : error instanceof Error
          ? error.message
          : 'An unexpected error occurred';

      setError(finalErrorMessage);
      throw error;
    }
  }, [setLoading, setSuccess, setError, showConfirmation]);

  return {
    ...state,
    setLoading,
    setError,
    setSuccess,
    clearFeedback,
    handleAsyncOperation,
  };
};

// Specialized hooks for common operations
export const useFormFeedback = () => {
  const feedback = useFeedback();

  const handleSubmit = useCallback(async <T>(
    submitFn: () => Promise<T>,
    options: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: any) => void;
    } = {}
  ) => {
    try {
      const result = await feedback.handleAsyncOperation(submitFn, {
        loadingMessage: 'Saving...',
        successMessage: options.successMessage || 'Saved successfully!',
        errorMessage: options.errorMessage,
      });

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      if (options.onError) {
        options.onError(error);
      }
      throw error;
    }
  }, [feedback]);

  return {
    ...feedback,
    handleSubmit,
  };
};

export const useDeleteFeedback = () => {
  const feedback = useFeedback();

  const handleDelete = useCallback(async (
    deleteFn: () => Promise<void>,
    resourceName: string,
    options: {
      onSuccess?: () => void;
      onError?: (error: any) => void;
    } = {}
  ) => {
    try {
      await feedback.handleAsyncOperation(deleteFn, {
        loadingMessage: `Deleting ${resourceName.toLowerCase()}...`,
        successMessage: `${resourceName} deleted successfully!`,
        showSuccessConfirmation: true,
        confirmationTitle: 'Deleted',
      });

      if (options.onSuccess) {
        options.onSuccess();
      }
    } catch (error) {
      if (options.onError) {
        options.onError(error);
      }
      throw error;
    }
  }, [feedback]);

  return {
    ...feedback,
    handleDelete,
  };
};

export const useLoadingFeedback = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading,
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const clearLoading = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    } else {
      setLoadingStates({});
    }
  }, []);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    clearLoading,
    loadingStates,
  };
};