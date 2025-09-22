import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useCacheWarming, useSmartPrefetch, useIntelligentPrefetch, useIdlePrefetch } from '../hooks/useCacheWarming';
import { useCacheInvalidation, useBackgroundSync } from '../hooks/useCacheInvalidation';
import { useCacheMetrics, useQueryCacheMetrics } from '../hooks/useCacheMetrics';
import { CacheManager, SessionCache } from '../utils/cacheManager';
import { OfflineQueue, useOfflineQueue } from '../utils/offlineQueue';
import { CachePersistence, useCachePersistence } from '../utils/cachePersistence';
import { PerformanceMonitor, usePerformanceMonitor } from '../utils/performanceMonitor';

// Cache context interface
interface CacheContextType {
  // Cache warming and prefetching
  warmCache: () => Promise<void>;
  prefetchOnHover: (id: string, type: 'position' | 'interview') => { startPrefetch: () => void; cancelPrefetch: () => void };
  prefetchRelatedData: (positionId: string) => void;
  
  // Cache invalidation
  invalidatePositions: () => void;
  invalidatePosition: (id: string) => void;
  invalidateInterviews: () => void;
  invalidateInterview: (id: string, positionId?: string) => void;
  clearAllCache: () => void;
  
  // Background sync
  syncCriticalData: () => void;
  startBackgroundSync: (interval?: number) => () => void;
  
  // Cache metrics
  cacheMetrics: ReturnType<typeof useCacheMetrics>['metrics'];
  queryMetrics: ReturnType<typeof useQueryCacheMetrics>['queryMetrics'];
  getCacheHealthScore: () => number;
  exportMetrics: () => void;
  
  // Cache management
  getCacheSize: () => { totalSize: number; itemCount: number };
  clearExpiredCache: () => void;
  
  // User preferences
  getUserPreferences: () => ReturnType<typeof CacheManager.getUserPreferences>;
  setUserPreferences: (prefs: Parameters<typeof CacheManager.setUserPreferences>[0]) => void;
  
  // Offline support
  offlineQueue: ReturnType<typeof useOfflineQueue>['queue'];
  isOnline: boolean;
  addToOfflineQueue: ReturnType<typeof useOfflineQueue>['addToQueue'];
  processOfflineQueue: () => void;
  clearOfflineQueue: () => void;
  
  // Cache persistence
  isRestored: boolean;
  persistenceStats: ReturnType<typeof useCachePersistence>['persistenceStats'];
  persistCache: () => void;
  clearPersistedCache: () => void;
  
  // Performance monitoring
  performanceMetrics: ReturnType<typeof usePerformanceMonitor>['metrics'];
  performanceSummary: ReturnType<typeof usePerformanceMonitor>['summary'];
  startMeasurement: ReturnType<typeof usePerformanceMonitor>['startMeasurement'];
  exportPerformanceData: () => void;
  clearPerformanceData: () => void;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

// Cache provider component
export const CacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Initialize cache warming and prefetching
  const { warmCache } = useCacheWarming();
  const { prefetchOnHover, prefetchRelatedData } = useSmartPrefetch();
  const { prefetchBasedOnRoute, prefetchBasedOnTime, prefetchBasedOnUserActivity } = useIntelligentPrefetch();
  useIdlePrefetch();
  
  // Initialize cache invalidation and background sync
  const {
    invalidatePositions,
    invalidatePosition,
    invalidateInterviews,
    invalidateInterview,
    clearAllCache,
  } = useCacheInvalidation();
  
  const {
    syncCriticalData,
    startBackgroundSync,
    syncOnReconnect,
    syncOnVisibilityChange,
  } = useBackgroundSync();
  
  // Initialize cache metrics
  const {
    metrics: cacheMetrics,
    getCacheHealthScore,
    exportMetrics,
    trackCacheHit,
    trackCacheMiss,
    trackQueryTime,
    trackMutationTime,
    trackError,
    trackSuccess,
  } = useCacheMetrics();
  
  const { queryMetrics } = useQueryCacheMetrics();
  
  // Initialize offline support
  const {
    queue: offlineQueue,
    isOnline,
    addToQueue: addToOfflineQueue,
    processQueue: processOfflineQueue,
    clearQueue: clearOfflineQueue,
  } = useOfflineQueue();
  
  // Initialize cache persistence
  const {
    isRestored,
    persistenceStats,
    persistCache,
    clearPersistedCache,
  } = useCachePersistence(queryClient);
  
  // Initialize performance monitoring
  const {
    metrics: performanceMetrics,
    summary: performanceSummary,
    startMeasurement,
    exportData: exportPerformanceData,
    clearData: clearPerformanceData,
  } = usePerformanceMonitor();
  
  // Set up route-based prefetching
  useEffect(() => {
    prefetchBasedOnRoute(location.pathname);
  }, [location.pathname, prefetchBasedOnRoute]);
  
  // Set up time-based prefetching
  useEffect(() => {
    prefetchBasedOnTime();
    
    // Set up periodic time-based prefetching
    const interval = setInterval(prefetchBasedOnTime, 60 * 60 * 1000); // Every hour
    return () => clearInterval(interval);
  }, [prefetchBasedOnTime]);
  
  // Set up background sync
  useEffect(() => {
    const stopBackgroundSync = startBackgroundSync();
    const stopReconnectSync = syncOnReconnect();
    const stopVisibilitySync = syncOnVisibilityChange();
    
    return () => {
      stopBackgroundSync();
      stopReconnectSync();
      stopVisibilitySync();
    };
  }, [startBackgroundSync, syncOnReconnect, syncOnVisibilityChange]);
  
  // Set up performance monitoring
  useEffect(() => {
    // Monitor query performance
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        
        if (response.ok) {
          trackSuccess();
          if (args[0]?.toString().includes('/api/')) {
            trackQueryTime(args[0].toString(), duration);
          }
        } else {
          trackError();
        }
        
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        trackError();
        trackQueryTime(args[0]?.toString() || 'unknown', duration);
        throw error;
      }
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, [trackSuccess, trackError, trackQueryTime]);
  
  // Set up cache hit/miss tracking
  useEffect(() => {
    // Override localStorage methods to track cache operations
    const originalGetItem = localStorage.getItem;
    const originalSetItem = localStorage.setItem;
    
    localStorage.getItem = function(key: string) {
      const startTime = performance.now();
      const result = originalGetItem.call(this, key);
      const duration = performance.now() - startTime;
      
      if (key.startsWith('cache_') || key.startsWith('draft_')) {
        if (result) {
          trackCacheHit();
        } else {
          trackCacheMiss();
        }
      }
      
      return result;
    };
    
    localStorage.setItem = function(key: string, value: string) {
      const startTime = performance.now();
      const result = originalSetItem.call(this, key, value);
      const duration = performance.now() - startTime;
      
      return result;
    };
    
    return () => {
      localStorage.getItem = originalGetItem;
      localStorage.setItem = originalSetItem;
    };
  }, [trackCacheHit, trackCacheMiss]);
  
  // User activity tracking for intelligent prefetching
  useEffect(() => {
    let lastActivity = new Date();
    
    const updateActivity = () => {
      lastActivity = new Date();
    };
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });
    
    // Check for user activity patterns
    const activityInterval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity.getTime();
      
      // If user has been inactive for 10 minutes, prefetch based on common patterns
      if (timeSinceActivity > 10 * 60 * 1000) {
        prefetchBasedOnUserActivity('idle');
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(activityInterval);
    };
  }, [prefetchBasedOnUserActivity]);
  
  // Cache cleanup on app start
  useEffect(() => {
    CacheManager.clearExpiredCache();
    
    // Set up periodic cleanup
    const cleanupInterval = setInterval(() => {
      CacheManager.clearExpiredCache();
    }, 30 * 60 * 1000); // Every 30 minutes
    
    return () => clearInterval(cleanupInterval);
  }, []);
  
  // Context value
  const contextValue: CacheContextType = {
    // Cache warming and prefetching
    warmCache,
    prefetchOnHover,
    prefetchRelatedData,
    
    // Cache invalidation
    invalidatePositions,
    invalidatePosition,
    invalidateInterviews,
    invalidateInterview,
    clearAllCache,
    
    // Background sync
    syncCriticalData,
    startBackgroundSync,
    
    // Cache metrics
    cacheMetrics,
    queryMetrics,
    getCacheHealthScore,
    exportMetrics,
    
    // Cache management
    getCacheSize: CacheManager.getCacheSize,
    clearExpiredCache: CacheManager.clearExpiredCache,
    
    // User preferences
    getUserPreferences: CacheManager.getUserPreferences,
    setUserPreferences: CacheManager.setUserPreferences,
    
    // Offline support
    offlineQueue,
    isOnline,
    addToOfflineQueue,
    processOfflineQueue,
    clearOfflineQueue,
    
    // Cache persistence
    isRestored,
    persistenceStats,
    persistCache,
    clearPersistedCache,
    
    // Performance monitoring
    performanceMetrics,
    performanceSummary,
    startMeasurement,
    exportPerformanceData,
    clearPerformanceData,
  };
  
  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  );
};

// Hook to use cache context
export const useCache = (): CacheContextType => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};

// HOC for components that need cache functionality
export const withCache = <P extends object>(Component: React.ComponentType<P>) => {
  return React.forwardRef<any, P>((props, ref) => (
    <CacheProvider>
      <Component {...props} ref={ref} />
    </CacheProvider>
  ));
};

// Cache status component for debugging
export const CacheStatus: React.FC<{ showDetails?: boolean }> = ({ showDetails = false }) => {
  const {
    cacheMetrics,
    queryMetrics,
    getCacheHealthScore,
    exportMetrics,
    clearExpiredCache,
    isOnline,
    offlineQueue,
    persistenceStats,
    performanceSummary,
    exportPerformanceData,
  } = useCache();
  
  const healthScore = getCacheHealthScore();
  
  if (!showDetails) {
    return (
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg text-xs">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            healthScore >= 80 ? 'bg-green-500' : 
            healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Cache: {healthScore}%</span>
          <span>Hit Rate: {(cacheMetrics.hitRate * 100).toFixed(1)}%</span>
          {offlineQueue.length > 0 && (
            <span className="text-orange-500">Queue: {offlineQueue.length}</span>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-xs max-w-md max-h-96 overflow-y-auto">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">System Status</h3>
          <div className="flex space-x-1">
            <div className={`px-2 py-1 rounded text-white ${
              healthScore >= 80 ? 'bg-green-500' : 
              healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              {healthScore}%
            </div>
            <div className={`px-2 py-1 rounded text-white ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
        
        {/* Cache Metrics */}
        <div>
          <h4 className="font-medium mb-1">Cache</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-gray-600 dark:text-gray-400">Hit Rate</div>
              <div className="font-mono">{(cacheMetrics.hitRate * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Queries</div>
              <div className="font-mono">{queryMetrics.totalQueries}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Size</div>
              <div className="font-mono">{(cacheMetrics.cacheSize / 1024).toFixed(1)}KB</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Avg Response</div>
              <div className="font-mono">{cacheMetrics.averageResponseTime.toFixed(0)}ms</div>
            </div>
          </div>
        </div>
        
        {/* Offline Queue */}
        {(offlineQueue.length > 0 || !isOnline) && (
          <div>
            <h4 className="font-medium mb-1">Offline Queue</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-gray-600 dark:text-gray-400">Pending</div>
                <div className="font-mono">{offlineQueue.length}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Status</div>
                <div className={`font-mono ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? 'Syncing' : 'Queued'}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Persistence */}
        <div>
          <h4 className="font-medium mb-1">Persistence</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-gray-600 dark:text-gray-400">Entries</div>
              <div className="font-mono">{persistenceStats.entryCount}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Size</div>
              <div className="font-mono">{(persistenceStats.size / 1024).toFixed(1)}KB</div>
            </div>
          </div>
        </div>
        
        {/* Performance */}
        <div>
          <h4 className="font-medium mb-1">Performance</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-gray-600 dark:text-gray-400">Operations</div>
              <div className="font-mono">{performanceSummary.totalOperations}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Avg Duration</div>
              <div className="font-mono">{performanceSummary.averageDuration.toFixed(0)}ms</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Slow Ops</div>
              <div className="font-mono text-red-600">{performanceSummary.slowOperations}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Types</div>
              <div className="font-mono">{Object.keys(performanceSummary.byType).length}</div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={clearExpiredCache}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            Clean Cache
          </button>
          <button
            onClick={exportMetrics}
            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
          >
            Export Cache
          </button>
          <button
            onClick={exportPerformanceData}
            className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
          >
            Export Perf
          </button>
        </div>
      </div>
    </div>
  );
};