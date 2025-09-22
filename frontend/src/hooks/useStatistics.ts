import { useQuery } from '@tanstack/react-query';
import { statisticsService } from '../services';
import { queryKeys } from '../lib/queryClient';

// Query hooks
export const useStatisticsOverview = () => {
  return useQuery({
    queryKey: queryKeys.statistics.overview(),
    queryFn: () => statisticsService.getOverview(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePositionStats = () => {
  return useQuery({
    queryKey: queryKeys.statistics.positions(),
    queryFn: () => statisticsService.getPositionStats(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useInterviewStats = () => {
  return useQuery({
    queryKey: queryKeys.statistics.interviews(),
    queryFn: () => statisticsService.getInterviewStats(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCompanyStats = () => {
  return useQuery({
    queryKey: queryKeys.statistics.companies(),
    queryFn: () => statisticsService.getCompanyStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes for less frequently changing data
  });
};

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: queryKeys.statistics.dashboard(),
    queryFn: () => statisticsService.getDashboardSummary(),
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard data
    refetchOnWindowFocus: true, // Refetch when user returns to dashboard
  });
};

export const useStatsByDateRange = (dateFrom: string, dateTo: string) => {
  return useQuery({
    queryKey: queryKeys.statistics.custom({ dateFrom, dateTo }),
    queryFn: () => statisticsService.getStatsByDateRange(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMonthlyStats = (year?: number) => {
  const currentYear = year || new Date().getFullYear();
  
  return useQuery({
    queryKey: queryKeys.statistics.monthly(currentYear),
    queryFn: () => statisticsService.getMonthlyStats(currentYear),
    staleTime: 10 * 60 * 1000,
  });
};

export const useSuccessRates = () => {
  return useQuery({
    queryKey: [...queryKeys.statistics.all, 'success-rates'],
    queryFn: () => statisticsService.getSuccessRates(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useTimeStats = () => {
  return useQuery({
    queryKey: [...queryKeys.statistics.all, 'time-metrics'],
    queryFn: () => statisticsService.getTimeStats(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useInterviewTrends = () => {
  return useQuery({
    queryKey: [...queryKeys.statistics.all, 'interview-trends'],
    queryFn: () => statisticsService.getInterviewTrends(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useStatusProgression = () => {
  return useQuery({
    queryKey: [...queryKeys.statistics.all, 'status-progression'],
    queryFn: () => statisticsService.getStatusProgression(),
    staleTime: 15 * 60 * 1000, // 15 minutes for analytical data
  });
};

export const useTopCompanies = (limit: number = 10) => {
  return useQuery({
    queryKey: [...queryKeys.statistics.all, 'top-companies', limit],
    queryFn: () => statisticsService.getTopCompanies(limit),
    staleTime: 15 * 60 * 1000,
  });
};

export const useInterviewTypeStats = () => {
  return useQuery({
    queryKey: [...queryKeys.statistics.all, 'interview-types'],
    queryFn: () => statisticsService.getInterviewTypeStats(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useWeeklyActivity = () => {
  return useQuery({
    queryKey: [...queryKeys.statistics.all, 'weekly-activity'],
    queryFn: () => statisticsService.getWeeklyActivity(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useApplicationSources = () => {
  return useQuery({
    queryKey: [...queryKeys.statistics.all, 'application-sources'],
    queryFn: () => statisticsService.getApplicationSources(),
    staleTime: 15 * 60 * 1000,
  });
};

export const useSalaryStats = () => {
  return useQuery({
    queryKey: [...queryKeys.statistics.all, 'salary-analysis'],
    queryFn: () => statisticsService.getSalaryStats(),
    staleTime: 15 * 60 * 1000,
  });
};

export const useLocationStats = () => {
  return useQuery({
    queryKey: [...queryKeys.statistics.all, 'locations'],
    queryFn: () => statisticsService.getLocationStats(),
    staleTime: 15 * 60 * 1000,
  });
};

export const useCustomStats = (filters: {
  dateFrom?: string;
  dateTo?: string;
  companies?: string[];
  statuses?: string[];
  locations?: string[];
}) => {
  return useQuery({
    queryKey: queryKeys.statistics.custom(filters),
    queryFn: () => statisticsService.getCustomStats(filters),
    enabled: Object.keys(filters).some(key => filters[key as keyof typeof filters] !== undefined),
    staleTime: 5 * 60 * 1000,
  });
};

// Combined hooks for dashboard and analytics
export const useAnalyticsDashboard = () => {
  const overviewQuery = useStatisticsOverview();
  const successRatesQuery = useSuccessRates();
  const monthlyStatsQuery = useMonthlyStats();
  const topCompaniesQuery = useTopCompanies(5);

  return {
    overview: overviewQuery,
    successRates: successRatesQuery,
    monthlyStats: monthlyStatsQuery,
    topCompanies: topCompaniesQuery,
    isLoading: overviewQuery.isLoading || successRatesQuery.isLoading || 
               monthlyStatsQuery.isLoading || topCompaniesQuery.isLoading,
    error: overviewQuery.error || successRatesQuery.error || 
           monthlyStatsQuery.error || topCompaniesQuery.error,
  };
};

export const useMainDashboard = () => {
  const summaryQuery = useDashboardSummary();
  const weeklyActivityQuery = useWeeklyActivity();
  const interviewTrendsQuery = useInterviewTrends();

  return {
    summary: summaryQuery,
    weeklyActivity: weeklyActivityQuery,
    interviewTrends: interviewTrendsQuery,
    isLoading: summaryQuery.isLoading || weeklyActivityQuery.isLoading || interviewTrendsQuery.isLoading,
    error: summaryQuery.error || weeklyActivityQuery.error || interviewTrendsQuery.error,
  };
};

export const usePerformanceMetrics = () => {
  const successRatesQuery = useSuccessRates();
  const timeStatsQuery = useTimeStats();
  const statusProgressionQuery = useStatusProgression();
  const interviewTypeStatsQuery = useInterviewTypeStats();

  return {
    successRates: successRatesQuery,
    timeStats: timeStatsQuery,
    statusProgression: statusProgressionQuery,
    interviewTypeStats: interviewTypeStatsQuery,
    isLoading: successRatesQuery.isLoading || timeStatsQuery.isLoading || 
               statusProgressionQuery.isLoading || interviewTypeStatsQuery.isLoading,
    error: successRatesQuery.error || timeStatsQuery.error || 
           statusProgressionQuery.error || interviewTypeStatsQuery.error,
  };
};

export const useCompanyAnalytics = () => {
  const companyStatsQuery = useCompanyStats();
  const topCompaniesQuery = useTopCompanies();
  const locationStatsQuery = useLocationStats();

  return {
    companyStats: companyStatsQuery,
    topCompanies: topCompaniesQuery,
    locationStats: locationStatsQuery,
    isLoading: companyStatsQuery.isLoading || topCompaniesQuery.isLoading || locationStatsQuery.isLoading,
    error: companyStatsQuery.error || topCompaniesQuery.error || locationStatsQuery.error,
  };
};

// Utility hooks for specific use cases
export const useStatisticsForDateRange = (startDate: Date, endDate: Date) => {
  const dateFrom = startDate.toISOString().split('T')[0] || '';
  const dateTo = endDate.toISOString().split('T')[0] || '';
  
  return useStatsByDateRange(dateFrom, dateTo);
};

export const useCurrentMonthStats = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return useStatisticsForDateRange(startOfMonth, endOfMonth);
};

export const useCurrentYearStats = () => {
  const currentYear = new Date().getFullYear();
  return useMonthlyStats(currentYear);
};

export const useLast30DaysStats = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  return useStatisticsForDateRange(startDate, endDate);
};

export const useLast90DaysStats = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);
  
  return useStatisticsForDateRange(startDate, endDate);
};