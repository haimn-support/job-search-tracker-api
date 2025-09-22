import React, { useState, useEffect } from 'react';
import { Button } from './Button';

interface SuccessConfirmationProps {
  show: boolean;
  title: string;
  message: string;
  onClose: () => void;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  autoClose?: boolean;
  autoCloseDelay?: number;
  className?: string;
}

export const SuccessConfirmation: React.FC<SuccessConfirmationProps> = ({
  show,
  title,
  message,
  onClose,
  actions = [],
  autoClose = true,
  autoCloseDelay = 3000,
  className = '',
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!show || !autoClose) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (autoCloseDelay / 100));
        if (newProgress <= 0) {
          onClose();
          return 100;
        }
        return newProgress;
      });
    }, 100);

    return () => {
      clearInterval(interval);
      setProgress(100);
    };
  }, [show, autoClose, autoCloseDelay, onClose]);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}>
      <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Success Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-6">{message}</p>
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={() => {
                  action.action();
                  onClose();
                }}
                variant={action.variant || 'primary'}
                className="flex-1"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Auto-close progress bar */}
        {autoClose && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-green-600 h-1 rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

interface InlineSuccessProps {
  show: boolean;
  message: string;
  onDismiss?: () => void;
  className?: string;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const InlineSuccess: React.FC<InlineSuccessProps> = ({
  show,
  message,
  onDismiss,
  className = '',
  autoHide = true,
  autoHideDelay = 3000,
}) => {
  useEffect(() => {
    if (!show || !autoHide || !onDismiss) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, autoHideDelay);

    return () => clearTimeout(timer);
  }, [show, autoHide, autoHideDelay, onDismiss]);

  if (!show) return null;

  return (
    <div className={`flex items-center p-3 bg-green-50 border border-green-200 rounded-md ${className}`}>
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-green-800">{message}</p>
      </div>
      {onDismiss && (
        <div className="ml-auto pl-3">
          <button
            onClick={onDismiss}
            className="inline-flex text-green-400 hover:text-green-600 focus:outline-none focus:text-green-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

interface SuccessBannerProps {
  show: boolean;
  title: string;
  message?: string;
  onClose: () => void;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  className?: string;
}

export const SuccessBanner: React.FC<SuccessBannerProps> = ({
  show,
  title,
  message,
  onClose,
  actions = [],
  className = '',
}) => {
  if (!show) return null;

  return (
    <div className={`bg-green-50 border-l-4 border-green-400 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-green-800">{title}</h3>
          {message && (
            <p className="mt-1 text-sm text-green-700">{message}</p>
          )}
          {actions.length > 0 && (
            <div className="mt-3 flex space-x-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="text-sm font-medium text-green-800 hover:text-green-900 underline"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={onClose}
            className="inline-flex text-green-400 hover:text-green-600 focus:outline-none focus:text-green-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for managing success confirmations
export const useSuccessConfirmation = () => {
  const [confirmation, setConfirmation] = useState<{
    show: boolean;
    title: string;
    message: string;
    actions?: Array<{
      label: string;
      action: () => void;
      variant?: 'primary' | 'secondary' | 'danger';
    }>;
  }>({
    show: false,
    title: '',
    message: '',
  });

  const showConfirmation = (
    title: string,
    message: string,
    actions?: Array<{
      label: string;
      action: () => void;
      variant?: 'primary' | 'secondary' | 'danger';
    }>
  ) => {
    setConfirmation({
      show: true,
      title,
      message,
      actions,
    });
  };

  const hideConfirmation = () => {
    setConfirmation(prev => ({ ...prev, show: false }));
  };

  return {
    confirmation,
    showConfirmation,
    hideConfirmation,
  };
};