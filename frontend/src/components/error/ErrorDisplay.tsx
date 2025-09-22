import React from 'react';
import { Button } from '../ui/Button';
import { getErrorMessage, getErrorSeverityColor, UserFriendlyError } from '../../utils/errorMessages';

interface ErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
  showActions?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  compact = false,
  showActions = true,
}) => {
  const errorInfo = getErrorMessage(error);
  const severityClasses = getErrorSeverityColor(errorInfo.severity);

  const getIcon = (severity: UserFriendlyError['severity']) => {
    switch (severity) {
      case 'error':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center p-3 rounded-md border ${severityClasses} ${className}`}>
        <div className="flex-shrink-0">
          {getIcon(errorInfo.severity)}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{errorInfo.message}</p>
        </div>
        {(onRetry || onDismiss) && (
          <div className="ml-3 flex-shrink-0">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="secondary"
                size="sm"
                className="mr-2"
              >
                Retry
              </Button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-md border p-4 ${severityClasses} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getIcon(errorInfo.severity)}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{errorInfo.title}</h3>
          <div className="mt-2 text-sm">
            <p className="whitespace-pre-line">{errorInfo.message}</p>
          </div>
          
          {showActions && (errorInfo.actions || onRetry) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  variant="primary"
                  size="sm"
                >
                  Try Again
                </Button>
              )}
              {errorInfo.actions?.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.action}
                  variant={action.variant || 'secondary'}
                  size="sm"
                >
                  {action.label}
                </Button>
              ))}
              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  variant="secondary"
                  size="sm"
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
        {onDismiss && !showActions && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Specialized error display components
export const InlineErrorDisplay: React.FC<Omit<ErrorDisplayProps, 'compact'>> = (props) => (
  <ErrorDisplay {...props} compact={true} />
);

export const FormErrorDisplay: React.FC<ErrorDisplayProps> = (props) => (
  <ErrorDisplay {...props} className="mb-4" />
);

export const PageErrorDisplay: React.FC<ErrorDisplayProps> = (props) => (
  <div className="min-h-64 flex items-center justify-center">
    <div className="max-w-md w-full">
      <ErrorDisplay {...props} />
    </div>
  </div>
);

export const CardErrorDisplay: React.FC<ErrorDisplayProps> = (props) => (
  <div className="bg-white rounded-lg shadow p-6">
    <ErrorDisplay {...props} />
  </div>
);

export default ErrorDisplay;