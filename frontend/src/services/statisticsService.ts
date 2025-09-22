import { apiRequest } from './httpClient';
import { PositionStatistics } from '../types';

class StatisticsService {
  /**
   * Get comprehensive position and interview statistics
   */
  async getOverview(): Promise<PositionStatistics> {
    return apiRequest.get<PositionStatistics>('/statistics');
  }

  /**
   * Get position statistics only
   */
  async getPositionStats(): Promise<{
    total_positions: number;
    positions_by_status: Record<string, number>;
  }> {
    return apiRequest.get('/statistics/positions');
  }

  /**
   * Get interview statistics only
   */
  async getInterviewStats(): Promise<{
    total_interviews: number;
    interviews_by_outcome: Record<string, number>;
    interviews_by_type: Record<string, number>;
  }> {
    return apiRequest.get('/statistics/interviews');
  }

  /**
   * Get company-wise statistics
   */
  async getCompanyStats(): Promise<Array<{
    name: string;
    position_count: number;
    interview_count: number;
  }>> {
    return apiRequest.get('/statistics/companies');
  }

  /**
   * Get statistics for a specific date range
   */
  async getStatsByDateRange(dateFrom: string, dateTo: string): Promise<PositionStatistics> {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
    });
    
    return apiRequest.get<PositionStatistics>(`/statistics?${params.toString()}`);
  }

  /**
   * Get monthly statistics for the current year
   */
  async getMonthlyStats(year?: number): Promise<Array<{
    month: string;
    positions_applied: number;
    interviews_conducted: number;
    offers_received: number;
  }>> {
    const currentYear = year || new Date().getFullYear();
    return apiRequest.get(`/statistics/monthly/${currentYear}`);
  }

  /**
   * Get success rate statistics
   */
  async getSuccessRates(): Promise<{
    application_to_interview_rate: number;
    interview_to_offer_rate: number;
    overall_success_rate: number;
    average_interviews_per_position: number;
  }> {
    return apiRequest.get('/statistics/success-rates');
  }

  /**
   * Get time-based statistics (how long processes take)
   */
  async getTimeStats(): Promise<{
    average_days_to_first_interview: number;
    average_days_to_offer: number;
    average_interview_process_duration: number;
  }> {
    return apiRequest.get('/statistics/time-metrics');
  }

  /**
   * Get interview outcome trends
   */
  async getInterviewTrends(): Promise<Array<{
    date: string;
    passed: number;
    failed: number;
    pending: number;
    cancelled: number;
  }>> {
    return apiRequest.get('/statistics/interview-trends');
  }

  /**
   * Get position status progression
   */
  async getStatusProgression(): Promise<Array<{
    from_status: string;
    to_status: string;
    count: number;
    average_days: number;
  }>> {
    return apiRequest.get('/statistics/status-progression');
  }

  /**
   * Get top performing companies (highest success rates)
   */
  async getTopCompanies(limit: number = 10): Promise<Array<{
    company: string;
    applications: number;
    interviews: number;
    offers: number;
    success_rate: number;
  }>> {
    return apiRequest.get(`/statistics/top-companies?limit=${limit}`);
  }

  /**
   * Get interview type effectiveness
   */
  async getInterviewTypeStats(): Promise<Array<{
    type: string;
    total_conducted: number;
    pass_rate: number;
    average_duration: number;
  }>> {
    return apiRequest.get('/statistics/interview-types');
  }

  /**
   * Get weekly activity summary
   */
  async getWeeklyActivity(): Promise<Array<{
    week_start: string;
    positions_applied: number;
    interviews_scheduled: number;
    interviews_completed: number;
    offers_received: number;
  }>> {
    return apiRequest.get('/statistics/weekly-activity');
  }

  /**
   * Get application source effectiveness (if tracking sources)
   */
  async getApplicationSources(): Promise<Array<{
    source: string;
    applications: number;
    success_rate: number;
  }>> {
    return apiRequest.get('/statistics/application-sources');
  }

  /**
   * Get salary range statistics
   */
  async getSalaryStats(): Promise<{
    average_salary_applied: number;
    average_salary_offered: number;
    salary_ranges: Array<{
      range: string;
      count: number;
      success_rate: number;
    }>;
  }> {
    return apiRequest.get('/statistics/salary-analysis');
  }

  /**
   * Get location-based statistics
   */
  async getLocationStats(): Promise<Array<{
    location: string;
    applications: number;
    success_rate: number;
    average_salary: number;
  }>> {
    return apiRequest.get('/statistics/locations');
  }

  /**
   * Get custom statistics with filters
   */
  async getCustomStats(filters: {
    dateFrom?: string;
    dateTo?: string;
    companies?: string[];
    statuses?: string[];
    locations?: string[];
  }): Promise<PositionStatistics> {
    const params = new URLSearchParams();
    
    if (filters.dateFrom) {
      params.append('date_from', filters.dateFrom);
    }
    if (filters.dateTo) {
      params.append('date_to', filters.dateTo);
    }
    if (filters.companies?.length) {
      filters.companies.forEach(company => params.append('companies', company));
    }
    if (filters.statuses?.length) {
      filters.statuses.forEach(status => params.append('statuses', status));
    }
    if (filters.locations?.length) {
      filters.locations.forEach(location => params.append('locations', location));
    }
    
    const queryString = params.toString();
    const url = queryString ? `/statistics/custom?${queryString}` : '/statistics/custom';
    
    return apiRequest.get<PositionStatistics>(url);
  }

  /**
   * Export statistics data
   */
  async exportStats(format: 'csv' | 'json' = 'json'): Promise<Blob> {
    const response = await apiRequest.get(`/statistics/export?format=${format}`, {
      responseType: 'blob',
    });
    return response as Blob;
  }

  /**
   * Get dashboard summary (key metrics for dashboard display)
   */
  async getDashboardSummary(): Promise<{
    total_positions: number;
    active_applications: number;
    upcoming_interviews: number;
    recent_offers: number;
    this_week_activity: {
      applications: number;
      interviews: number;
    };
    success_rates: {
      interview_rate: number;
      offer_rate: number;
    };
  }> {
    return apiRequest.get('/statistics/dashboard');
  }
}

// Export singleton instance
export const statisticsService = new StatisticsService();
export default statisticsService;