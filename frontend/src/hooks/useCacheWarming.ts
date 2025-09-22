import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { positionService, interviewService, statisticsService } from '../services';

// Cache warming hook for preloading critical data
export const useCacheWarming = () => {
  const queryClient = useQueryClient();

  const warmCache = useCallback(async () => {
    try {
      // Prefetch positions list (most commonly accessed)
      await queryClient.prefetchQuery({
        queryKey: queryKeys.positions.lists(),
        queryFn: () => positionService.getPositions(),
        staleTime: 2 * 60 * 1000, // 2 minutes
      });

      // Prefetch dashboard statistics
      await queryClient.prefetchQuery({
        queryKey: queryKeys.statistics.dashboard(),
        queryFn: () => statisticsService.getDashboardSummary(),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });

      // Prefetch upcoming interviews
      await queryClient.prefetchQuery({
        queryKey: queryKeys.interviews.upcoming(),
        queryFn: () => interviewService.getUpcomingInterviews(),
        staleTime: 2 * 60 * 1000, // 2 minutes
      });

      // Prefetch today's interviews
      await queryClient.prefetchQuery({
        queryKey: queryKeys.interviews.today(),
        queryFn: () => interviewService.getTodayInterviews(),
        staleTime: 1 * 60 * 1000, // 1 minute (more frequent for today's data)
      });

    } catch (error) {
      console.warn('Cache warming failed:', error);
    }
  }, [queryClient]);

  useEffect(() => {
    // Warm cache after a short delay to not block initial render
    const timer = setTimeout(warmCache, 1000);
    return () => clearTimeout(timer);
  }, [warmCache]);

  return { warmCache };
};

// Smart prefetching hook based on user behavior
export const useSmartPrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchOnHover = useCallback((id: string, type: 'position' | 'interview') => {
    let timer: NodeJS.Timeout;

    const startPrefetch = () => {
      timer = setTimeout(() => {
        if (type === 'position') {
          queryClient.prefetchQuery({
            queryKey: queryKeys.positions.detail(id),
            queryFn: () => positionService.getPosition(id),
            staleTime: 5 * 60 * 1000,
          });

          // Also prefetch interviews for this position
          queryClient.prefetchQuery({
            queryKey: queryKeys.interviews.list(id),
            queryFn: () => interviewService.getInterviews(id),
            staleTime: 2 * 60 * 1000,
          });
        } else if (type === 'interview') {
          queryClient.prefetchQuery({
            queryKey: queryKeys.interviews.detail(id),
            queryFn: () => interviewService.getInterview(id),
            staleTime: 5 * 60 * 1000,
          });
        }
      }, 200); // 200ms delay to avoid prefetching on quick hovers
    };

    const cancelPrefetch = () => {
      if (timer) {
        clearTimeout(timer);
      }
    };

    return { startPrefetch, cancelPrefetch };
  }, [queryClient]);

  const prefetchPositionDetails = useCallback((id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.positions.detail(id),
      queryFn: () => positionService.getPosition(id),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  const prefetchPositionInterviews = useCallback((positionId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.interviews.list(positionId),
      queryFn: () => interviewService.getInterviews(positionId),
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient]);

  const prefetchRelatedData = useCallback((positionId: string) => {
    // Prefetch position details
    prefetchPositionDetails(positionId);
    
    // Prefetch interviews for this position
    prefetchPositionInterviews(positionId);
    
    // Prefetch statistics for this position
    queryClient.prefetchQuery({
      queryKey: queryKeys.interviews.stats(positionId),
      queryFn: () => interviewService.getInterviewStats(positionId),
      staleTime: 10 * 60 * 1000,
    });
  }, [queryClient, prefetchPositionDetails, prefetchPositionInterviews]);

  const prefetchNextPage = useCallback((currentFilters: any, currentPage: number) => {
    // Prefetch next page of positions
    const nextPageFilters = { ...currentFilters, page: currentPage + 1 };
    queryClient.prefetchQuery({
      queryKey: queryKeys.positions.list(nextPageFilters),
      queryFn: () => positionService.getPositions(nextPageFilters),
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient]);

  const prefetchFilteredData = useCallback((filters: any) => {
    // Prefetch data with new filters
    queryClient.prefetchQuery({
      queryKey: queryKeys.positions.list(filters),
      queryFn: () => positionService.getPositions(filters),
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient]);

  return {
    prefetchOnHover,
    prefetchPositionDetails,
    prefetchPositionInterviews,
    prefetchRelatedData,
    prefetchNextPage,
    prefetchFilteredData,
  };
};

// Intelligent prefetching based on user navigation patterns
export const useIntelligentPrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchBasedOnRoute = useCallback((currentRoute: string) => {
    switch (currentRoute) {
      case '/dashboard':
        // Prefetch positions and statistics
        queryClient.prefetchQuery({
          queryKey: queryKeys.positions.recent(),
          queryFn: () => positionService.getRecentPositions(),
          staleTime: 2 * 60 * 1000,
        });
        
        queryClient.prefetchQuery({
          queryKey: queryKeys.statistics.overview(),
          queryFn: () => statisticsService.getOverview(),
          staleTime: 5 * 60 * 1000,
        });
        break;

      case '/positions':
        // Prefetch statistics that might be viewed next
        queryClient.prefetchQuery({
          queryKey: queryKeys.statistics.positions(),
          queryFn: () => statisticsService.getPositionStats(),
          staleTime: 10 * 60 * 1000,
        });
        break;

      case '/statistics':
        // Prefetch detailed statistics data
        queryClient.prefetchQuery({
          queryKey: queryKeys.statistics.interviews(),
          queryFn: () => statisticsService.getInterviewStats(),
          staleTime: 10 * 60 * 1000,
        });
        
        queryClient.prefetchQuery({
          queryKey: queryKeys.statistics.companies(),
          queryFn: () => statisticsService.getCompanyStats(),
          staleTime: 15 * 60 * 1000,
        });
        break;

      default:
        break;
    }
  }, [queryClient]);

  const prefetchBasedOnTime = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();

    // Morning: prefetch today's interviews and recent activity
    if (hour >= 6 && hour < 12) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.interviews.today(),
        queryFn: () => interviewService.getTodayInterviews(),
        staleTime: 1 * 60 * 1000,
      });
    }
    
    // Afternoon: prefetch upcoming interviews and position updates
    else if (hour >= 12 && hour < 18) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.interviews.upcoming(),
        queryFn: () => interviewService.getUpcomingInterviews(),
        staleTime: 2 * 60 * 1000,
      });
    }
    
    // Evening: prefetch statistics and weekly summaries
    else if (hour >= 18 || hour < 6) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.statistics.overview(),
        queryFn: () => statisticsService.getOverview(),
        staleTime: 10 * 60 * 1000,
      });
    }
  }, [queryClient]);

  const prefetchBasedOnUserActivity = useCallback((lastActivity: string) => {
    // Prefetch data based on user's most common activities
    switch (lastActivity) {
      case 'created_position':
        // User likely to add interviews next
        queryClient.prefetchQuery({
          queryKey: queryKeys.interviews.upcoming(),
          queryFn: () => interviewService.getUpcomingInterviews(),
          staleTime: 2 * 60 * 1000,
        });
        break;

      case 'updated_interview':
        // User likely to check statistics next
        queryClient.prefetchQuery({
          queryKey: queryKeys.statistics.overview(),
          queryFn: () => statisticsService.getOverview(),
          staleTime: 5 * 60 * 1000,
        });
        break;

      case 'viewed_statistics':
        // User likely to go back to positions
        queryClient.prefetchQuery({
          queryKey: queryKeys.positions.lists(),
          queryFn: () => positionService.getPositions(),
          staleTime: 2 * 60 * 1000,
        });
        break;

      default:
        break;
    }
  }, [queryClient]);

  return {
    prefetchBasedOnRoute,
    prefetchBasedOnTime,
    prefetchBasedOnUserActivity,
  };
};

// Background prefetching for idle time
export const useIdlePrefetch = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    let isIdle = false;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      isIdle = false;
      
      idleTimer = setTimeout(() => {
        isIdle = true;
        performIdlePrefetch();
      }, 30000); // 30 seconds of inactivity
    };

    const performIdlePrefetch = async () => {
      if (!isIdle) return;

      try {
        // Prefetch less critical data during idle time
        await queryClient.prefetchQuery({
          queryKey: queryKeys.statistics.companies(),
          queryFn: () => statisticsService.getCompanyStats(),
          staleTime: 15 * 60 * 1000,
        });

        await queryClient.prefetchQuery({
          queryKey: queryKeys.interviews.overdue(),
          queryFn: () => interviewService.getOverdueInterviews(),
          staleTime: 5 * 60 * 1000,
        });

        // Prefetch monthly statistics for current year
        const currentYear = new Date().getFullYear();
        await queryClient.prefetchQuery({
          queryKey: queryKeys.statistics.monthly(currentYear),
          queryFn: () => statisticsService.getMonthlyStats(currentYear),
          staleTime: 30 * 60 * 1000,
        });

      } catch (error) {
        console.warn('Idle prefetch failed:', error);
      }
    };

    // Set up event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    // Start the idle timer
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
    };
  }, [queryClient]);
};