import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { PerformanceMonitor } from './performanceMonitor';

// Lazy loading configuration
interface LazyLoadConfig {
  fallback?: React.ComponentType;
  retryCount?: number;
  retryDelay?: number;
  preload?: boolean;
  chunkName?: string;
}

// Default loading component
const DefaultFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Error boundary for lazy loaded components
class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy load error:', error, errorInfo);
    this.props.onError?.(error);
    
    // Track error in performance monitor
    PerformanceMonitor.addEntry({
      name: 'Lazy Load Error',
      startTime: performance.now(),
      duration: 0,
      type: 'render',
      metadata: {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent />;
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
    <div className="text-red-500 mb-2">
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <p className="text-gray-600 text-sm text-center">
      Failed to load component. Please refresh the page.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
    >
      Refresh
    </button>
  </div>
);

// Enhanced lazy loading with retry logic
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  config: LazyLoadConfig = {}
): LazyExoticComponent<T> => {
  const {
    retryCount = 3,
    retryDelay = 1000,
    chunkName,
  } = config;

  const lazyImport = () => {
    const endMeasurement = PerformanceMonitor.startMeasurement(
      `Lazy Load: ${chunkName || 'Unknown'}`,
      'render',
      { chunkName }
    );

    let attempts = 0;

    const attemptImport = (): Promise<{ default: T }> => {
      attempts++;
      
      return importFn().catch((error) => {
        console.error(`Lazy load attempt ${attempts} failed:`, error);
        
        if (attempts < retryCount) {
          console.log(`Retrying lazy load in ${retryDelay}ms...`);
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              attemptImport().then(resolve).catch(reject);
            }, retryDelay * attempts); // Exponential backoff
          });
        } else {
          endMeasurement();
          throw error;
        }
      }).then((module) => {
        endMeasurement();
        return module;
      });
    };

    return attemptImport();
  };

  return React.lazy(lazyImport);
};

// Lazy component wrapper with error boundary and suspense
export const LazyWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType;
  onError?: (error: Error) => void;
}> = ({ children, fallback = DefaultFallback, errorFallback, onError }) => {
  return (
    <LazyLoadErrorBoundary fallback={errorFallback} onError={onError}>
      <Suspense fallback={<fallback />}>
        {children}
      </Suspense>
    </LazyLoadErrorBoundary>
  );
};

// Preload utility for lazy components
export const preloadComponent = (lazyComponent: LazyExoticComponent<any>): void => {
  // Access the _payload to trigger preloading
  const payload = (lazyComponent as any)._payload;
  if (payload && typeof payload._result === 'undefined') {
    payload._result = payload._init(payload._payload);
  }
};

// Route-based code splitting utilities
export const createLazyRoute = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  chunkName?: string
) => {
  return createLazyComponent(importFn, { chunkName: `route-${chunkName}` });
};

// Feature-based code splitting
export const createLazyFeature = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  featureName: string
) => {
  return createLazyComponent(importFn, { chunkName: `feature-${featureName}` });
};

// Component-based code splitting
export const createLazyModal = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  modalName: string
) => {
  return createLazyComponent(importFn, { chunkName: `modal-${modalName}` });
};

// Intersection Observer based lazy loading for components
export const useLazyIntersection = (
  threshold: number = 0.1,
  rootMargin: string = '50px'
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasIntersected, setHasIntersected] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, hasIntersected]);

  return { ref, isIntersecting, hasIntersected };
};

// Lazy component that loads when it comes into view
export const LazyIntersectionComponent: React.FC<{
  component: LazyExoticComponent<any>;
  fallback?: React.ComponentType;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  [key: string]: any;
}> = ({ 
  component: Component, 
  fallback = DefaultFallback, 
  threshold, 
  rootMargin, 
  className,
  ...props 
}) => {
  const { ref, hasIntersected } = useLazyIntersection(threshold, rootMargin);

  return (
    <div ref={ref} className={className}>
      {hasIntersected ? (
        <LazyWrapper fallback={fallback}>
          <Component {...props} />
        </LazyWrapper>
      ) : (
        <fallback />
      )}
    </div>
  );
};

// Bundle size analyzer utility
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    // This would integrate with webpack-bundle-analyzer in a real setup
    console.log('Bundle analysis is available in production builds');
    return;
  }

  // Estimate current bundle size based on loaded scripts
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  let totalSize = 0;

  const sizePromises = scripts.map(async (script) => {
    try {
      const response = await fetch((script as HTMLScriptElement).src, { method: 'HEAD' });
      const size = parseInt(response.headers.get('content-length') || '0', 10);
      return { src: (script as HTMLScriptElement).src, size };
    } catch (error) {
      return { src: (script as HTMLScriptElement).src, size: 0 };
    }
  });

  Promise.all(sizePromises).then((sizes) => {
    totalSize = sizes.reduce((sum, { size }) => sum + size, 0);
    
    console.group('Bundle Size Analysis');
    console.log(`Total bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
    sizes.forEach(({ src, size }) => {
      console.log(`${src.split('/').pop()}: ${(size / 1024).toFixed(2)} KB`);
    });
    console.groupEnd();

    // Track in performance monitor
    PerformanceMonitor.addEntry({
      name: 'Bundle Size Analysis',
      startTime: performance.now(),
      duration: 0,
      type: 'render',
      metadata: {
        totalSize,
        scriptCount: sizes.length,
        sizes,
      },
    });
  });
};

// Preload critical routes
export const preloadCriticalRoutes = (routes: LazyExoticComponent<any>[]) => {
  // Preload after initial render to avoid blocking
  setTimeout(() => {
    routes.forEach((route) => {
      try {
        preloadComponent(route);
      } catch (error) {
        console.warn('Failed to preload route:', error);
      }
    });
  }, 2000);
};

// Dynamic import with performance tracking
export const dynamicImport = async <T>(
  importFn: () => Promise<T>,
  name: string
): Promise<T> => {
  const endMeasurement = PerformanceMonitor.startMeasurement(
    `Dynamic Import: ${name}`,
    'render',
    { importName: name }
  );

  try {
    const module = await importFn();
    endMeasurement();
    return module;
  } catch (error) {
    endMeasurement();
    throw error;
  }
};

// Chunk loading status hook
export const useChunkLoadingStatus = () => {
  const [loadingChunks, setLoadingChunks] = React.useState<Set<string>>(new Set());
  const [failedChunks, setFailedChunks] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    // Listen for chunk loading events (this would need webpack integration)
    const handleChunkLoad = (event: CustomEvent) => {
      const { chunkName, status } = event.detail;
      
      if (status === 'loading') {
        setLoadingChunks(prev => new Set(prev).add(chunkName));
      } else if (status === 'loaded') {
        setLoadingChunks(prev => {
          const newSet = new Set(prev);
          newSet.delete(chunkName);
          return newSet;
        });
      } else if (status === 'failed') {
        setLoadingChunks(prev => {
          const newSet = new Set(prev);
          newSet.delete(chunkName);
          return newSet;
        });
        setFailedChunks(prev => new Set(prev).add(chunkName));
      }
    };

    window.addEventListener('chunkload' as any, handleChunkLoad);
    
    return () => {
      window.removeEventListener('chunkload' as any, handleChunkLoad);
    };
  }, []);

  const retryFailedChunk = (chunkName: string) => {
    setFailedChunks(prev => {
      const newSet = new Set(prev);
      newSet.delete(chunkName);
      return newSet;
    });
    
    // Trigger chunk reload (implementation depends on bundler)
    window.location.reload();
  };

  return {
    loadingChunks: Array.from(loadingChunks),
    failedChunks: Array.from(failedChunks),
    retryFailedChunk,
    isLoading: loadingChunks.size > 0,
    hasFailed: failedChunks.size > 0,
  };
};