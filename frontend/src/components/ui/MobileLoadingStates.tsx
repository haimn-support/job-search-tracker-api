import React from 'react';
import { cn } from '../../utils/cn';

// Mobile-optimized spinner
export const MobileSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn('animate-spin', sizeClasses[size], className)}>
      <svg
        className="w-full h-full text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

// Mobile-optimized skeleton loader
export const MobileSkeleton: React.FC<{
  className?: string;
  lines?: number;
  avatar?: boolean;
}> = ({ className, lines = 3, avatar = false }) => {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="flex space-x-3">
        {avatar && (
          <div className="rounded-full bg-gray-200 h-10 w-10 flex-shrink-0" />
        )}
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-3 bg-gray-200 rounded',
                index === 0 && 'w-3/4',
                index === 1 && 'w-full',
                index === 2 && 'w-1/2',
                index > 2 && 'w-2/3'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Mobile-optimized progress bar
export const MobileProgressBar: React.FC<{
  progress: number;
  className?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}> = ({ progress, className, showPercentage = false, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">Loading</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300 ease-out',
            colorClasses[color]
          )}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
    </div>
  );
};

// Mobile-optimized loading overlay
export const MobileLoadingOverlay: React.FC<{
  isVisible: boolean;
  message?: string;
  className?: string;
}> = ({ isVisible, message = 'Loading...', className }) => {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
        className
      )}
    >
      <div className="bg-white rounded-lg p-6 mx-4 max-w-sm w-full text-center shadow-xl">
        <MobileSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

// Mobile-optimized card loading state
export const MobileCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="h-5 w-12 bg-gray-200 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-6 bg-gray-100 rounded mt-4" />
      </div>
    </div>
  );
};

// Mobile-optimized list loading state
export const MobileListSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 3, className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <MobileCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Mobile-optimized button loading state
export const MobileButtonLoading: React.FC<{
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
}> = ({ children, loading = false, className }) => {
  return (
    <div className={cn('relative', className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-md">
          <MobileSpinner size="sm" />
        </div>
      )}
      <div className={cn(loading && 'opacity-50')}>{children}</div>
    </div>
  );
};

export default {
  MobileSpinner,
  MobileSkeleton,
  MobileProgressBar,
  MobileLoadingOverlay,
  MobileCardSkeleton,
  MobileListSkeleton,
  MobileButtonLoading,
};