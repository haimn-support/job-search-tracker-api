import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { positionService } from '../services';
import { queryKeys, invalidateQueries, optimisticUpdates, cacheConfigs } from '../lib/queryClient';
import { useCacheInvalidation } from './useCacheInvalidation';
import { CacheManager } from '../utils/cacheManager';
import {
  PositionListResponse,
  CreatePositionData,
  UpdatePositionData,
  PositionFilters,
} from '../types';

// Query hooks
export const usePositions = (filters?: PositionFilters) => {
  return useQuery({
    queryKey: queryKeys.positions.list(filters),
    queryFn: () => positionService.getPositions(filters),
    ...cacheConfigs.positions,
    select: (data: PositionListResponse) => data,
    onSuccess: (data) => {
      // Cache the response for offline access
      CacheManager.save(`positions_${JSON.stringify(filters)}`, data, 5 * 60 * 1000);
    },
  });
};

export const usePosition = (id: string) => {
  return useQuery({
    queryKey: queryKeys.positions.detail(id),
    queryFn: () => positionService.getPosition(id),
    enabled: !!id,
    ...cacheConfigs.positions,
    onSuccess: (data) => {
      // Cache individual position data
      CacheManager.save(`position_${id}`, data, 10 * 60 * 1000);
    },
  });
};

export const usePositionSummary = () => {
  return useQuery({
    queryKey: queryKeys.positions.summary(),
    queryFn: () => positionService.getPositionSummary(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRecentPositions = () => {
  return useQuery({
    queryKey: queryKeys.positions.recent(),
    queryFn: () => positionService.getRecentPositions(),
    staleTime: 5 * 60 * 1000,
  });
};

export const usePositionsByStatus = (status: string) => {
  return useQuery({
    queryKey: queryKeys.positions.byStatus(status),
    queryFn: () => positionService.getPositionsByStatus(status),
    enabled: !!status,
    staleTime: 2 * 60 * 1000,
  });
};

export const usePositionsByCompany = (company: string) => {
  return useQuery({
    queryKey: queryKeys.positions.byCompany(company),
    queryFn: () => positionService.getPositionsByCompany(company),
    enabled: !!company,
    staleTime: 5 * 60 * 1000,
  });
};

// Mutation hooks
export const useCreatePosition = () => {
  const queryClient = useQueryClient();
  const { invalidateByMutation } = useCacheInvalidation();

  return useMutation({
    mutationFn: (data: CreatePositionData) => positionService.createPosition(data),
    onMutate: async (newPosition) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.positions.lists() });

      // Snapshot previous value
      const previousPositions = queryClient.getQueriesData({ queryKey: queryKeys.positions.lists() });

      // Optimistically update
      const tempPosition = {
        id: `temp-${Date.now()}`,
        ...newPosition,
        user_id: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        interviews: [],
      };

      optimisticUpdates.addPosition(tempPosition);

      return { previousPositions };
    },
    onError: (_err, _newPosition, context) => {
      // Rollback on error
      if (context?.previousPositions) {
        context.previousPositions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to create position');
    },
    onSuccess: (data) => {
      toast.success('Position created successfully');
      // Cache the new position
      CacheManager.save(`position_${data.id}`, data, 10 * 60 * 1000);
      // Use smart invalidation
      invalidateByMutation('create', 'position');
    },
    onSettled: () => {
      // Clear any expired cache entries
      CacheManager.clearExpiredCache();
    },
  });
};

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePositionData }) =>
      positionService.updatePosition(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.positions.detail(id) });

      // Snapshot previous value
      const previousPosition = queryClient.getQueryData(queryKeys.positions.detail(id));

      // Optimistically update
      optimisticUpdates.updatePosition(id, data);

      return { previousPosition, id };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousPosition) {
        queryClient.setQueryData(queryKeys.positions.detail(id), context.previousPosition);
      }
      toast.error('Failed to update position');
    },
    onSuccess: (_data) => {
      toast.success('Position updated successfully');
    },
    onSettled: (_data, _error, { id }) => {
      // Always refetch after mutation
      invalidateQueries.position(id);
    },
  });
};

export const useUpdatePositionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      positionService.updatePositionStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.positions.detail(id) });
      const previousPosition = queryClient.getQueryData(queryKeys.positions.detail(id));
      
      optimisticUpdates.updatePosition(id, { status });
      
      return { previousPosition, id };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousPosition) {
        queryClient.setQueryData(queryKeys.positions.detail(id), context.previousPosition);
      }
      toast.error('Failed to update position status');
    },
    onSuccess: () => {
      toast.success('Position status updated');
    },
    onSettled: (_data, _error, { id }) => {
      invalidateQueries.position(id);
    },
  });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => positionService.deletePosition(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.positions.lists() });
      const previousPositions = queryClient.getQueriesData({ queryKey: queryKeys.positions.lists() });
      
      optimisticUpdates.removePosition(id);
      
      return { previousPositions };
    },
    onError: (_err, _id, context) => {
      if (context?.previousPositions) {
        context.previousPositions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to delete position');
    },
    onSuccess: () => {
      toast.success('Position deleted successfully');
    },
    onSettled: () => {
      invalidateQueries.positions();
    },
  });
};

export const useDuplicatePosition = () => {
  return useMutation({
    mutationFn: (id: string) => positionService.duplicatePosition(id),
    onSuccess: (_data) => {
      toast.success('Position duplicated successfully');
      invalidateQueries.positions();
    },
    onError: () => {
      toast.error('Failed to duplicate position');
    },
  });
};

export const useArchivePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => positionService.archivePosition(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.positions.detail(id) });
      const previousPosition = queryClient.getQueryData(queryKeys.positions.detail(id));
      
      optimisticUpdates.updatePosition(id, { status: 'withdrawn' });
      
      return { previousPosition, id };
    },
    onError: (_err, id, context) => {
      if (context?.previousPosition) {
        queryClient.setQueryData(queryKeys.positions.detail(id), context.previousPosition);
      }
      toast.error('Failed to archive position');
    },
    onSuccess: () => {
      toast.success('Position archived successfully');
    },
    onSettled: (_data, _error, id) => {
      invalidateQueries.position(id);
    },
  });
};

// Prefetch hooks
export const usePrefetchPosition = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.positions.detail(id),
      queryFn: () => positionService.getPosition(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Combined hooks for common patterns
export const usePositionWithInterviews = (id: string) => {
  const positionQuery = usePosition(id);
  
  // Prefetch interviews when position loads
  const queryClient = useQueryClient();
  
  if (positionQuery.data && !positionQuery.isLoading) {
    queryClient.prefetchQuery({
      queryKey: queryKeys.interviews.list(id),
      queryFn: () => import('../services').then(({ interviewService }) => interviewService.getInterviews(id)),
      staleTime: 2 * 60 * 1000,
    });
  }
  
  return positionQuery;
};

export const usePositionsWithPrefetch = (filters?: PositionFilters) => {
  const positionsQuery = usePositions(filters);
  const prefetchPosition = usePrefetchPosition();
  
  return {
    ...positionsQuery,
    prefetchPosition,
  };
};