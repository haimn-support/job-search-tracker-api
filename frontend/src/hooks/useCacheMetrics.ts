import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CacheManager } from '../utils/cacheManager';

// Cache metrics interface
export interface CacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
  cacheSize: number;
  itemCount: number;
  queryCount: number;
  mutationCount: number;
  staleCacheCount: number;
  errorRate: number;
  averageResponseTime: number;
}

// Performance metrics interface
export interface PerformanceMetrics {
  queryTimes: Record<string, number[]>;
  mutationTimes: Record<string, number[]>;
  cacheOperationTimes: number[];
  networkRequestTimes: number[];
}

// Cache hit/miss tracking hook
export const useCacheMetrics = () => {
  const queryClient = useQueryClient();
  const [metrics, setMetrics] = useState<CacheMetrics>({
    hits: 0,
    misses: 0,
    totalRequests: 0,
    hitRate: 0,
    cacheSize: 0,
    itemCount: 0,
    queryCount: 0,
    mutationCount: 0,
    staleCacheCount: 0,
    errorRate: 0,
    averageResponseTime: 0,
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    queryTimes: {},
    mutationTimes: {},
    cacheOperationTimes: [],
    networkRequestTimes: [],
  });

  const [errors, setErrors] = useState<number>(0);
  const [totalOperations, setTotalOperations] = useState<number>(0);

  // Track cache hit
  const trackCacheHit = useCallback(() => {
    setMetrics(prev => {
      const newHits = prev.hits + 1;
      const newTotal = prev.totalRequests + 1;
      return {
        ...prev,
        hits: newHits,
        totalRequests: newTotal,
        hitRate: newTotal > 0 ? newHits / newTotal : 0,
      };
    });
  }, []);

  // Track cache miss
  const trackCacheMiss = useCallback(() => {
    setMetrics(prev => {
      const newMisses = prev.misses + 1;
      const newTotal = prev.totalRequests + 1;
      return {
        ...prev,
        misses: newMisses,
        totalRequests: newTotal,
        hitRate: newTotal > 0 ? prev.hits / newTotal : 0,
      };
    });
  }, []);

  // Track query performance
  const trackQueryTime = useCallback((queryKey: string, duration: number) => {
    setPerformanceMetrics(prev => ({
      ...prev,
      queryTimes: {
        ...prev.queryTimes,
        [queryKey]: [...(prev.queryTimes[queryKey] || []), duration].slice(-10), // Keep last 10 measurements
      },
    }));
  }, []);

  // Track mutation performance
  const trackMutationTime = useCallback((mutationKey: string, duration: number) => {
    setPerformanceMetrics(prev => ({
      ...prev,
      mutationTimes: {
        ...prev.mutationTimes,
        [mutationKey]: [...(prev.mutationTimes[mutationKey] || []), duration].slice(-10),
      },
    }));
  }, []);

  // Track cache operation performance
  const trackCacheOperation = useCallback((duration: number) => {
    setPerformanceMetrics(prev => ({
      ...prev,
      cacheOperationTimes: [...prev.cacheOperationTimes, duration].slice(-50), // Keep last 50 measurements
    }));
  }, []);

  // Track network request performance
  const trackNetworkRequest = useCallback((duration: number) => {
    setPerformanceMetrics(prev => ({
      ...prev,
      networkRequestTimes: [...prev.networkRequestTimes, duration].slice(-50),
    }));
  }, []);

  // Track errors
  const trackError = useCallback(() => {
    setErrors(prev => prev + 1);
    setTotalOperations(prev => prev + 1);
  }, []);

  // Track successful operations
  const trackSuccess = useCallback(() => {
    setTotalOperations(prev => prev + 1);
  }, []);

  // Update cache size metrics
  const updateCacheSize = useCallback(() => {
    const { totalSize, itemCount } = CacheManager.getCacheSize();
    const queryCache = queryClient.getQueryCache();
    const mutationCache = queryClient.getMutationCache();
    
    const queries = queryCache.getAll();
    const mutations = mutationCache.getAll();
    
    const staleQueries = queries.filter(query => query.isStale()).length;

    setMetrics(prev => ({
      ...prev,
      cacheSize: totalSize,
      itemCount,
      queryCount: queries.length,
      mutationCount: mutations.length,
      staleCacheCount: staleQueries,
      errorRate: totalOperations > 0 ? errors / totalOperations : 0,
    }));
  }, [queryClient, errors, totalOperations]);

  // Calculate average response times
  const calculateAverageResponseTime = useCallback(() => {
    const allTimes = [
      ...Object.values(performanceMetrics.queryTimes).flat(),
      ...Object.values(performanceMetrics.mutationTimes).flat(),
      ...performanceMetrics.networkRequestTimes,
    ];

    const average = allTimes.length > 0 
      ? allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length 
      : 0;

    setMetrics(prev => ({
      ...prev,
      averageResponseTime: average,
    }));
  }, [performanceMetrics]);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateCacheSize();
      calculateAverageResponseTime();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [updateCacheSize, calculateAverageResponseTime]);

  // Get detailed performance statistics
  const getPerformanceStats = useCallback(() => {
    const queryStats = Object.entries(performanceMetrics.queryTimes).map(([key, times]) => ({
      queryKey: key,
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      sampleCount: times.length,
    }));

    const mutationStats = Object.entries(performanceMetrics.mutationTimes).map(([key, times]) => ({
      mutationKey: key,
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      sampleCount: times.length,
    }));

    const cacheOperationAvg = performanceMetrics.cacheOperationTimes.length > 0
      ? performanceMetrics.cacheOperationTimes.reduce((sum, time) => sum + time, 0) / performanceMetrics.cacheOperationTimes.length
      : 0;

    const networkRequestAvg = performanceMetrics.networkRequestTimes.length > 0
      ? performanceMetrics.networkRequestTimes.reduce((sum, time) => sum + time, 0) / performanceMetrics.networkRequestTimes.length
      : 0;

    return {
      queries: queryStats,
      mutations: mutationStats,
      cacheOperationAverage: cacheOperationAvg,
      networkRequestAverage: networkRequestAvg,
    };
  }, [performanceMetrics]);

  // Get cache health score (0-100)
  const getCacheHealthScore = useCallback(() => {
    let score = 100;

    // Deduct points for low hit rate
    if (metrics.hitRate < 0.8) {
      score -= (0.8 - metrics.hitRate) * 50;
    }

    // Deduct points for high error rate
    if (metrics.errorRate > 0.1) {
      score -= (metrics.errorRate - 0.1) * 100;
    }

    // Deduct points for slow response times
    if (metrics.averageResponseTime > 1000) {
      score -= Math.min(30, (metrics.averageResponseTime - 1000) / 100);
    }

    // Deduct points for too many stale cache entries
    const staleRatio = metrics.queryCount > 0 ? metrics.staleCacheCount / metrics.queryCount : 0;
    if (staleRatio > 0.3) {
      score -= (staleRatio - 0.3) * 50;
    }

    return Math.max(0, Math.round(score));
  }, [metrics]);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setMetrics({
      hits: 0,
      misses: 0,
      totalRequests: 0,
      hitRate: 0,
      cacheSize: 0,
      itemCount: 0,
      queryCount: 0,
      mutationCount: 0,
      staleCacheCount: 0,
      errorRate: 0,
      averageResponseTime: 0,
    });
    setPerformanceMetrics({
      queryTimes: {},
      mutationTimes: {},
      cacheOperationTimes: [],
      networkRequestTimes: [],
    });
    setErrors(0);
    setTotalOperations(0);
  }, []);

  // Export metrics to JSON
  const exportMetrics = useCallback(() => {
    const exportData = {
      metrics,
      performanceMetrics,
      performanceStats: getPerformanceStats(),
      healthScore: getCacheHealthScore(),
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cache-metrics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [metrics, performanceMetrics, getPerformanceStats, getCacheHealthScore]);

  return {
    metrics,
    performanceMetrics,
    trackCacheHit,
    trackCacheMiss,
    trackQueryTime,
    trackMutationTime,
    trackCacheOperation,
    trackNetworkRequest,
    trackError,
    trackSuccess,
    getPerformanceStats,
    getCacheHealthScore,
    resetMetrics,
    exportMetrics,
  };
};

// Hook for monitoring React Query cache specifically
export const useQueryCacheMetrics = () => {
  const queryClient = useQueryClient();
  const [queryMetrics, setQueryMetrics] = useState({
    totalQueries: 0,
    activeQueries: 0,
    staleQueries: 0,
    fetchingQueries: 0,
    errorQueries: 0,
    cacheSize: 0,
  });

  const updateQueryMetrics = useCallback(() => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();

    const activeQueries = queries.filter(query => query.getObserversCount() > 0);
    const staleQueries = queries.filter(query => query.isStale());
    const fetchingQueries = queries.filter(query => query.state.isFetching);
    const errorQueries = queries.filter(query => query.state.status === 'error');

    // Estimate cache size (rough approximation)
    const estimatedSize = queries.reduce((size, query) => {
      const dataSize = query.state.data ? JSON.stringify(query.state.data).length : 0;
      return size + dataSize;
    }, 0);

    setQueryMetrics({
      totalQueries: queries.length,
      activeQueries: activeQueries.length,
      staleQueries: staleQueries.length,
      fetchingQueries: fetchingQueries.length,
      errorQueries: errorQueries.length,
      cacheSize: estimatedSize,
    });
  }, [queryClient]);

  useEffect(() => {
    // Update metrics immediately
    updateQueryMetrics();

    // Set up periodic updates
    const interval = setInterval(updateQueryMetrics, 2000);

    // Listen to query cache events
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      updateQueryMetrics();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [queryClient, updateQueryMetrics]);

  const getQueryDetails = useCallback(() => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();

    return queries.map(query => ({
      queryKey: query.queryKey,
      status: query.state.status,
      isFetching: query.state.isFetching,
      isStale: query.isStale(),
      observersCount: query.getObserversCount(),
      dataUpdatedAt: query.state.dataUpdatedAt,
      errorUpdatedAt: query.state.errorUpdatedAt,
      fetchFailureCount: query.state.fetchFailureCount,
      dataSize: query.state.data ? JSON.stringify(query.state.data).length : 0,
    }));
  }, [queryClient]);

  const clearStaleQueries = useCallback(() => {
    queryClient.removeQueries({
      predicate: (query) => query.isStale() && query.getObserversCount() === 0,
    });
  }, [queryClient]);

  const clearErrorQueries = useCallback(() => {
    queryClient.removeQueries({
      predicate: (query) => query.state.status === 'error',
    });
  }, [queryClient]);

  return {
    queryMetrics,
    getQueryDetails,
    clearStaleQueries,
    clearErrorQueries,
    updateQueryMetrics,
  };
};