import React from 'react';
import ErrorBoundary, { ErrorFallbackProps } from './ErrorBoundary';
import { Button } from '../ui/Button';

interface FeatureErrorBoundaryProps {
  children: React.ReactNode;
  feature: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

// Feature-specific error fallback components
const PositionErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, retry }) => (
  <div className="bg-white rounded-lg shadow p-6 text-center">
    <div className="mx-auto h-12 w-12 text-red-500 mb-4">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Position Loading Error
    </h3>
    <p className="text-sm text-gray-600 mb-4">
      We couldn't load your positions. This might be a temporary issue.
    </p>
    <div className="space-x-3">
      <Button onClick={retry || resetError} variant="primary" size="sm">
        Try Again
      </Button>
      <Button onClick={() => window.location.href = '/dashboard'} variant="secondary" size="sm">
        Go to Dashboard
      </Button>
    </div>
  </div>
);

const InterviewErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, retry }) => (
  <div className="bg-white rounded-lg border border-red-200 p-4 text-center">
    <div className="mx-auto h-8 w-8 text-red-500 mb-2">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h4 className="text-sm font-medium text-gray-900 mb-1">
      Interview Error
    </h4>
    <p className="text-xs text-gray-600 mb-3">
      Failed to load interview data.
    </p>
    <Button onClick={retry || resetError} variant="primary" size="sm">
      Retry
    </Button>
  </div>
);

const StatisticsErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, retry }) => (
  <div className="bg-white rounded-lg shadow p-6 text-center">
    <div className="mx-auto h-12 w-12 text-red-500 mb-4">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Statistics Unavailable
    </h3>
    <p className="text-sm text-gray-600 mb-4">
      We couldn't load your statistics. Please try again or check back later.
    </p>
    <div className="space-x-3">
      <Button onClick={retry || resetError} variant="primary" size="sm">
        Retry
      </Button>
      <Button onClick={() => window.location.href = '/positions'} variant="secondary" size="sm">
        View Positions
      </Button>
    </div>
  </div>
);

const FormErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, retry }) => (
  <div className="bg-red-50 border border-red-200 rounded-md p-4">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="ml-3 flex-1">
        <h3 className="text-sm font-medium text-red-800">
          Form Error
        </h3>
        <p className="mt-1 text-sm text-red-700">
          There was an error with the form. Please refresh and try again.
        </p>
        <div className="mt-3">
          <Button onClick={retry || resetError} variant="primary" size="sm">
            Reset Form
          </Button>
        </div>
      </div>
    </div>
  </div>
);

// Feature-specific error boundary components
export const PositionErrorBoundary: React.FC<Omit<FeatureErrorBoundaryProps, 'feature'>> = ({ children, ...props }) => (
  <ErrorBoundary fallback={PositionErrorFallback} {...props}>
    {children}
  </ErrorBoundary>
);

export const InterviewErrorBoundary: React.FC<Omit<FeatureErrorBoundaryProps, 'feature'>> = ({ children, ...props }) => (
  <ErrorBoundary fallback={InterviewErrorFallback} {...props}>
    {children}
  </ErrorBoundary>
);

export const StatisticsErrorBoundary: React.FC<Omit<FeatureErrorBoundaryProps, 'feature'>> = ({ children, ...props }) => (
  <ErrorBoundary fallback={StatisticsErrorFallback} {...props}>
    {children}
  </ErrorBoundary>
);

export const FormErrorBoundary: React.FC<Omit<FeatureErrorBoundaryProps, 'feature'>> = ({ children, ...props }) => (
  <ErrorBoundary fallback={FormErrorFallback} {...props}>
    {children}
  </ErrorBoundary>
);

// Generic feature error boundary
const FeatureErrorBoundary: React.FC<FeatureErrorBoundaryProps> = ({ 
  children, 
  feature, 
  onError,
  resetKeys 
}) => {
  const getFallbackComponent = (feature: string) => {
    switch (feature.toLowerCase()) {
      case 'position':
      case 'positions':
        return PositionErrorFallback;
      case 'interview':
      case 'interviews':
        return InterviewErrorFallback;
      case 'statistics':
      case 'stats':
        return StatisticsErrorFallback;
      case 'form':
        return FormErrorFallback;
      default:
        return undefined; // Will use default fallback
    }
  };

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log feature-specific error
    console.error(`Error in ${feature} feature:`, error, errorInfo);
    
    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // In production, you might want to send feature-specific error data
    // Example: analytics.track('feature_error', { feature, error: error.message });
  };

  return (
    <ErrorBoundary 
      fallback={getFallbackComponent(feature)}
      onError={handleError}
      resetKeys={resetKeys}
      resetOnPropsChange={true}
    >
      {children}
    </ErrorBoundary>
  );
};

export default FeatureErrorBoundary;