import React, { useRef, useEffect } from 'react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { cn } from '../../utils/cn';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className,
  threshold = 80,
  resistance = 2.5,
  enabled = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    attachPullToRefresh,
    isRefreshing,
    isPulling,
    pullDistance,
    progress,
    shouldRefresh,
  } = usePullToRefresh({
    onRefresh,
    threshold,
    resistance,
    enabled,
  });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const cleanup = attachPullToRefresh(element);
    return cleanup;
  }, [attachPullToRefresh]);

  // Only show pull to refresh on mobile devices
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (!isMobile || !enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      style={{
        transform: isPulling ? `translateY(${Math.min(pullDistance, threshold)}px)` : undefined,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Pull to refresh indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-10',
          'bg-gradient-to-b from-blue-50 to-transparent',
          isPulling || isRefreshing ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: Math.max(pullDistance, isRefreshing ? 60 : 0),
          transform: `translateY(-${Math.max(pullDistance, isRefreshing ? 60 : 0)}px)`,
        }}
      >
        <div className="flex flex-col items-center space-y-2 py-4">
          {/* Refresh icon */}
          <div
            className={cn(
              'w-8 h-8 rounded-full border-2 border-blue-500 flex items-center justify-center transition-all duration-200',
              isRefreshing && 'animate-spin',
              shouldRefresh && !isRefreshing && 'bg-blue-500 text-white',
              !shouldRefresh && 'text-blue-500'
            )}
            style={{
              transform: `rotate(${progress * 180}deg)`,
            }}
          >
            {isRefreshing ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            )}
          </div>

          {/* Status text */}
          <div className="text-xs font-medium text-blue-600">
            {isRefreshing
              ? 'Refreshing...'
              : shouldRefresh
              ? 'Release to refresh'
              : 'Pull to refresh'}
          </div>

          {/* Progress indicator */}
          <div className="w-16 h-1 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-100 rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn(isPulling && 'pointer-events-none')}>
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;