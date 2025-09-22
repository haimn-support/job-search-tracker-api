import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';

// Cache invalidation hook with smart invalidation strategies
export const useCacheInvalidation = () => {
  const queryClient = useQueryClient();

  // Invalidate all position-related queries
  const invalidatePositions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.positions.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
  }, [queryClient]);

  // Invalidate specific position and related data
  const invalidatePosition = useCallback((id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.positions.detail(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.positions.lists() });
    queryClient.invalidateQueries({ queryKey: queryKeys.interviews.list(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
  }, [queryClient]);

  // Invalidate all interview-related queries
  const invalidateInterviews = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.interviews.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
  }, [queryClient]);

  // Invalidate specific interview and related data
  const invalidateInterview = useCallback((id: string, positionId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.interviews.detail(id) });
    
    if (positionId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews.list(positionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.positions.detail(positionId) });
    }
    
    queryClient.invalidateQueries({ queryKey: queryKeys.interviews.upcoming() });
    queryClient.invalidateQueries({ queryKey: queryKeys.interviews.today() });
    queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
  }, [queryClient]);

  // Invalidate all statistics
  const invalidateStatistics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
  }, [queryClient]);

  // Smart invalidation based on mutation type
  const invalidateByMutation = useCallback((
    type: 'create' | 'update' | 'delete',
    resource: 'position' | 'interview',
    id?: string,
    positionId?: string
  ) => {
    switch (resource) {
      case 'position':
        if (type === 'create') {
          // New position created - invalidate lists and statistics
          queryClient.invalidateQueries({ queryKey: queryKeys.positions.lists() });
          queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
        } else if (type === 'update' && id) {
          // Position updated - invalidate specific position and lists
          invalidatePosition(id);
        } else if (type === 'delete') {
          // Position deleted - invalidate lists and statistics
          queryClient.invalidateQueries({ queryKey: queryKeys.positions.lists() });
          queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
          // Remove specific position from cache
          if (id) {
            queryClient.removeQueries({ queryKey: queryKeys.positions.detail(id) });
          }
        }
        break;

      case 'interview':
        if (type === 'create') {
          // New interview created - invalidate interview lists and position details
          if (positionId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.interviews.list(positionId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.positions.detail(positionId) });
          }
          queryClient.invalidateQueries({ queryKey: queryKeys.interviews.upcoming() });
          queryClient.invalidateQueries({ queryKey: queryKeys.interviews.today() });
          queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
        } else if (type === 'update' && id) {
          // Interview updated - invalidate specific interview and related data
          invalidateInterview(id, positionId);
        } else if (type === 'delete') {
          // Interview deleted - invalidate lists and statistics
          if (positionId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.interviews.list(positionId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.positions.detail(positionId) });
          }
          queryClient.invalidateQueries({ queryKey: queryKeys.interviews.upcoming() });
          queryClient.invalidateQueries({ queryKey: queryKeys.interviews.today() });
          queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
          // Remove specific interview from cache
          if (id) {
            queryClient.removeQueries({ queryKey: queryKeys.interviews.detail(id) });
          }
        }
        break;
    }
  }, [queryClient, invalidatePosition, invalidateInterview]);

  // Selective invalidation based on data changes
  const invalidateSelective = useCallback((changes: {
    positions?: boolean;
    interviews?: boolean;
    statistics?: boolean;
    specificPosition?: string;
    specificInterview?: string;
  }) => {
    if (changes.positions) {
      queryClient.invalidateQueries({ queryKey: queryKeys.positions.all });
    }
    
    if (changes.interviews) {
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews.all });
    }
    
    if (changes.statistics) {
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    }
    
    if (changes.specificPosition) {
      invalidatePosition(changes.specificPosition);
    }
    
    if (changes.specificInterview) {
      invalidateInterview(changes.specificInterview);
    }
  }, [queryClient, invalidatePosition, invalidateInterview]);

  // Time-based invalidation for stale data
  const invalidateStaleData = useCallback((maxAge: number = 10 * 60 * 1000) => {
    // Invalidate queries older than maxAge
    queryClient.invalidateQueries({
      predicate: (query) => {
        const lastUpdated = query.state.dataUpdatedAt;
        return lastUpdated > 0 && Date.now() - lastUpdated > maxAge;
      },
    });
  }, [queryClient]);

  // Force refresh all active queries
  const forceRefreshActive = useCallback(() => {
    queryClient.refetchQueries({
      type: 'active',
    });
  }, [queryClient]);

  // Clear all cache (nuclear option)
  const clearAllCache = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  // Remove specific queries from cache
  const removeFromCache = useCallback((
    resource: 'position' | 'interview',
    id: string
  ) => {
    if (resource === 'position') {
      queryClient.removeQueries({ queryKey: queryKeys.positions.detail(id) });
    } else if (resource === 'interview') {
      queryClient.removeQueries({ queryKey: queryKeys.interviews.detail(id) });
    }
  }, [queryClient]);

  // Batch invalidation for multiple operations
  const batchInvalidate = useCallback((operations: Array<{
    type: 'invalidate' | 'remove';
    resource: 'position' | 'interview' | 'statistics';
    id?: string;
    positionId?: string;
  }>) => {
    operations.forEach(({ type, resource, id, positionId }) => {
      if (type === 'invalidate') {
        switch (resource) {
          case 'position':
            if (id) {
              invalidatePosition(id);
            } else {
              invalidatePositions();
            }
            break;
          case 'interview':
            if (id) {
              invalidateInterview(id, positionId);
            } else {
              invalidateInterviews();
            }
            break;
          case 'statistics':
            invalidateStatistics();
            break;
        }
      } else if (type === 'remove' && id) {
        removeFromCache(resource as 'position' | 'interview', id);
      }
    });
  }, [
    queryClient,
    invalidatePosition,
    invalidatePositions,
    invalidateInterview,
    invalidateInterviews,
    invalidateStatistics,
    removeFromCache,
  ]);

  return {
    invalidatePositions,
    invalidatePosition,
    invalidateInterviews,
    invalidateInterview,
    invalidateStatistics,
    invalidateByMutation,
    invalidateSelective,
    invalidateStaleData,
    forceRefreshActive,
    clearAllCache,
    removeFromCache,
    batchInvalidate,
  };
};

// Background sync hook for keeping data fresh
export const useBackgroundSync = () => {
  const queryClient = useQueryClient();

  // Start background sync for active queries
  const startBackgroundSync = useCallback((interval: number = 5 * 60 * 1000) => {
    const syncInterval = setInterval(() => {
      // Refetch stale queries that are currently being observed
      queryClient.refetchQueries({
        type: 'active',
        stale: true,
      });
    }, interval);

    return () => clearInterval(syncInterval);
  }, [queryClient]);

  // Sync specific data types
  const syncPositions = useCallback(() => {
    queryClient.refetchQueries({
      queryKey: queryKeys.positions.all,
      type: 'active',
    });
  }, [queryClient]);

  const syncInterviews = useCallback(() => {
    queryClient.refetchQueries({
      queryKey: queryKeys.interviews.all,
      type: 'active',
    });
  }, [queryClient]);

  const syncStatistics = useCallback(() => {
    queryClient.refetchQueries({
      queryKey: queryKeys.statistics.all,
      type: 'active',
    });
  }, [queryClient]);

  // Sync critical data (today's interviews, recent positions)
  const syncCriticalData = useCallback(() => {
    queryClient.refetchQueries({
      queryKey: queryKeys.interviews.today(),
    });
    
    queryClient.refetchQueries({
      queryKey: queryKeys.interviews.upcoming(),
    });
    
    queryClient.refetchQueries({
      queryKey: queryKeys.positions.recent(),
    });
  }, [queryClient]);

  // Smart sync based on user activity
  const smartSync = useCallback((lastActivity: Date) => {
    const timeSinceActivity = Date.now() - lastActivity.getTime();
    
    // If user was inactive for more than 5 minutes, sync critical data
    if (timeSinceActivity > 5 * 60 * 1000) {
      syncCriticalData();
    }
    
    // If user was inactive for more than 15 minutes, sync all active queries
    if (timeSinceActivity > 15 * 60 * 1000) {
      queryClient.refetchQueries({
        type: 'active',
        stale: true,
      });
    }
  }, [queryClient, syncCriticalData]);

  // Sync on network reconnection
  const syncOnReconnect = useCallback(() => {
    const handleOnline = () => {
      // Refetch all active queries when coming back online
      queryClient.refetchQueries({
        type: 'active',
      });
    };

    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [queryClient]);

  // Sync on visibility change (tab becomes active)
  const syncOnVisibilityChange = useCallback(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refetch stale data when tab becomes visible
        queryClient.refetchQueries({
          type: 'active',
          stale: true,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);

  return {
    startBackgroundSync,
    syncPositions,
    syncInterviews,
    syncStatistics,
    syncCriticalData,
    smartSync,
    syncOnReconnect,
    syncOnVisibilityChange,
  };
};