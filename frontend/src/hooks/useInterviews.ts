import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { interviewService } from '../services';
import { queryKeys, invalidateQueries, optimisticUpdates, cacheConfigs } from '../lib/queryClient';
import { useCacheInvalidation } from './useCacheInvalidation';
import { CacheManager } from '../utils/cacheManager';
import {
  Interview,
  CreateInterviewData,
  UpdateInterviewData,
  InterviewOutcome,
} from '../types';

// Query hooks
export const useInterviews = (positionId: string) => {
  return useQuery({
    queryKey: queryKeys.interviews.list(positionId),
    queryFn: () => interviewService.getInterviews(positionId),
    enabled: !!positionId,
    ...cacheConfigs.interviews,
    onSuccess: (data) => {
      // Cache interviews for offline access
      CacheManager.save(`interviews_${positionId}`, data, 5 * 60 * 1000);
    },
  });
};

export const useInterview = (id: string) => {
  return useQuery({
    queryKey: queryKeys.interviews.detail(id),
    queryFn: () => interviewService.getInterview(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAllUserInterviews = () => {
  return useQuery({
    queryKey: queryKeys.interviews.all,
    queryFn: () => interviewService.getAllUserInterviews(),
    staleTime: 2 * 60 * 1000,
  });
};

export const useUpcomingInterviews = () => {
  return useQuery({
    queryKey: queryKeys.interviews.upcoming(),
    queryFn: () => interviewService.getUpcomingInterviews(),
    staleTime: 1 * 60 * 1000, // 1 minute for time-sensitive data
  });
};

export const useTodaysInterviews = () => {
  return useQuery({
    queryKey: queryKeys.interviews.today(),
    queryFn: () => interviewService.getTodaysInterviews(),
    staleTime: 30 * 1000, // 30 seconds for very time-sensitive data
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

export const useOverdueInterviews = () => {
  return useQuery({
    queryKey: queryKeys.interviews.overdue(),
    queryFn: () => interviewService.getOverdueInterviews(),
    staleTime: 1 * 60 * 1000,
  });
};

export const useInterviewsByOutcome = (outcome: string) => {
  return useQuery({
    queryKey: queryKeys.interviews.byOutcome(outcome),
    queryFn: () => interviewService.getInterviewsByOutcome(outcome),
    enabled: !!outcome,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePositionInterviewStats = (positionId: string) => {
  return useQuery({
    queryKey: queryKeys.interviews.stats(positionId),
    queryFn: () => interviewService.getPositionInterviewStats(positionId),
    enabled: !!positionId,
    staleTime: 5 * 60 * 1000,
  });
};

// Mutation hooks
export const useCreateInterview = () => {
  const queryClient = useQueryClient();
  const { invalidateByMutation } = useCacheInvalidation();

  return useMutation({
    mutationFn: (data: CreateInterviewData) => interviewService.createInterview(data),
    onMutate: async (newInterview) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.interviews.list(newInterview.position_id) 
      });

      // Snapshot previous value
      const previousInterviews = queryClient.getQueryData(
        queryKeys.interviews.list(newInterview.position_id)
      );

      // Optimistically update
      const tempInterview = {
        id: `temp-${Date.now()}`,
        ...newInterview,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData(
        queryKeys.interviews.list(newInterview.position_id),
        (old: Interview[] | undefined) => {
          if (!old) return [tempInterview];
          return [...old, tempInterview];
        }
      );

      return { previousInterviews, positionId: newInterview.position_id };
    },
    onError: (_err, _newInterview, context) => {
      // Rollback on error
      if (context?.previousInterviews) {
        queryClient.setQueryData(
          queryKeys.interviews.list(context.positionId),
          context.previousInterviews
        );
      }
      toast.error('Failed to create interview');
    },
    onSuccess: (data, variables) => {
      toast.success('Interview created successfully');
      // Cache the new interview
      CacheManager.save(`interview_${data.id}`, data, 10 * 60 * 1000);
      // Use smart invalidation
      invalidateByMutation('create', 'interview', data.id, variables.position_id);
    },
    onSettled: () => {
      // Clear any expired cache entries
      CacheManager.clearExpiredCache();
    },
  });
};

export const useUpdateInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInterviewData }) =>
      interviewService.updateInterview(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.interviews.detail(id) });

      // Snapshot previous value
      const previousInterview = queryClient.getQueryData(queryKeys.interviews.detail(id));

      // Get position ID for cache updates
      const interview = previousInterview as Interview;
      const positionId = interview?.position_id;

      // Optimistically update
      if (positionId) {
        optimisticUpdates.updateInterview(id, positionId, data);
      }

      return { previousInterview, id, positionId };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousInterview) {
        queryClient.setQueryData(queryKeys.interviews.detail(id), context.previousInterview);
      }
      toast.error('Failed to update interview');
    },
    onSuccess: () => {
      toast.success('Interview updated successfully');
    },
    onSettled: (_data, _error, { id }, context) => {
      // Always refetch after mutation
      invalidateQueries.interview(id, context?.positionId);
    },
  });
};

export const useUpdateInterviewField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, field, value }: { id: string; field: string; value: any }) =>
      interviewService.updateInterviewField(id, field, value),
    onMutate: async ({ id, field, value }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.interviews.detail(id) });
      
      const previousInterview = queryClient.getQueryData(queryKeys.interviews.detail(id)) as Interview;
      const positionId = previousInterview?.position_id;

      if (positionId) {
        optimisticUpdates.updateInterview(id, positionId, { [field]: value });
      }

      return { previousInterview, id, positionId };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousInterview) {
        queryClient.setQueryData(queryKeys.interviews.detail(id), context.previousInterview);
      }
      // Don't show toast for field updates to avoid spam
    },
    onSettled: (_data, _error, { id }, context) => {
      invalidateQueries.interview(id, context?.positionId);
    },
  });
};

export const useUpdateInterviewDate = () => {
  const updateField = useUpdateInterviewField();
  
  return useMutation({
    mutationFn: ({ id, scheduledDate }: { id: string; scheduledDate: string }) =>
      updateField.mutateAsync({ id, field: 'scheduled_date', value: scheduledDate }),
    onSuccess: () => {
      toast.success('Interview date updated');
    },
    onError: () => {
      toast.error('Failed to update interview date');
    },
  });
};

export const useUpdateInterviewOutcome = () => {
  const updateField = useUpdateInterviewField();
  
  return useMutation({
    mutationFn: ({ id, outcome }: { id: string; outcome: string }) =>
      updateField.mutateAsync({ id, field: 'outcome', value: outcome }),
    onSuccess: () => {
      toast.success('Interview outcome updated');
    },
    onError: () => {
      toast.error('Failed to update interview outcome');
    },
  });
};

export const useDeleteInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => interviewService.deleteInterview(id),
    onMutate: async (id) => {
      // Get interview data to find position ID
      const interview = queryClient.getQueryData(queryKeys.interviews.detail(id)) as Interview;
      const positionId = interview?.position_id;

      if (positionId) {
        await queryClient.cancelQueries({ queryKey: queryKeys.interviews.list(positionId) });
        
        const previousInterviews = queryClient.getQueryData(queryKeys.interviews.list(positionId));

        // Optimistically remove
        queryClient.setQueryData(
          queryKeys.interviews.list(positionId),
          (old: Interview[] | undefined) => {
            if (!old) return old;
            return old.filter(interview => interview.id !== id);
          }
        );

        return { previousInterviews, positionId };
      }

      return { positionId };
    },
    onError: (_err, _id, context) => {
      if (context?.previousInterviews && context?.positionId) {
        queryClient.setQueryData(
          queryKeys.interviews.list(context.positionId),
          context.previousInterviews
        );
      }
      toast.error('Failed to delete interview');
    },
    onSuccess: () => {
      toast.success('Interview deleted successfully');
    },
    onSettled: (_data, _error, id, context) => {
      invalidateQueries.interview(id, context?.positionId);
    },
  });
};

export const useRescheduleInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newDate, notes }: { id: string; newDate: string; notes?: string }) =>
      interviewService.rescheduleInterview(id, newDate, notes),
    onSuccess: () => {
      toast.success('Interview rescheduled successfully');
    },
    onError: () => {
      toast.error('Failed to reschedule interview');
    },
    onSettled: (_data, _error, { id }) => {
      const interview = queryClient.getQueryData(queryKeys.interviews.detail(id)) as Interview;
      invalidateQueries.interview(id, interview?.position_id);
    },
  });
};

export const useCancelInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      interviewService.cancelInterview(id, reason),
    onSuccess: () => {
      toast.success('Interview cancelled');
    },
    onError: () => {
      toast.error('Failed to cancel interview');
    },
    onSettled: (_data, _error, { id }) => {
      const interview = queryClient.getQueryData(queryKeys.interviews.detail(id)) as Interview;
      invalidateQueries.interview(id, interview?.position_id);
    },
  });
};

export const useCompleteInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, outcome, notes }: { id: string; outcome: InterviewOutcome.PASSED | InterviewOutcome.FAILED; notes?: string }) =>
      interviewService.completeInterview(id, outcome, notes),
    onSuccess: (_data, { outcome }) => {
      toast.success(`Interview marked as ${outcome}`);
    },
    onError: () => {
      toast.error('Failed to complete interview');
    },
    onSettled: (_data, _error, { id }) => {
      const interview = queryClient.getQueryData(queryKeys.interviews.detail(id)) as Interview;
      invalidateQueries.interview(id, interview?.position_id);
    },
  });
};

export const useBulkUpdateInterviews = () => {
  return useMutation({
    mutationFn: (updates: Array<{ id: string; data: Partial<UpdateInterviewData> }>) =>
      interviewService.bulkUpdateInterviews(updates),
    onSuccess: (data) => {
      toast.success(`${data.length} interviews updated successfully`);
    },
    onError: () => {
      toast.error('Failed to update interviews');
    },
    onSettled: () => {
      // Invalidate all interview queries since we don't know which positions were affected
      invalidateQueries.interviews();
    },
  });
};

// Combined hooks for common patterns
export const useInterviewsWithStats = (positionId: string) => {
  const interviewsQuery = useInterviews(positionId);
  const statsQuery = usePositionInterviewStats(positionId);

  return {
    interviews: interviewsQuery,
    stats: statsQuery,
    isLoading: interviewsQuery.isLoading || statsQuery.isLoading,
    error: interviewsQuery.error || statsQuery.error,
  };
};

export const useInterviewDashboard = () => {
  const upcomingQuery = useUpcomingInterviews();
  const todaysQuery = useTodaysInterviews();
  const overdueQuery = useOverdueInterviews();

  return {
    upcoming: upcomingQuery,
    today: todaysQuery,
    overdue: overdueQuery,
    isLoading: upcomingQuery.isLoading || todaysQuery.isLoading || overdueQuery.isLoading,
    error: upcomingQuery.error || todaysQuery.error || overdueQuery.error,
  };
};