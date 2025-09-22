import React, { useState } from 'react';
import { useAnalyticsDashboard, useStatsByDateRange } from '../../hooks/useStatistics';
import { Button } from '../ui/Button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { PositionStatusChart } from './PositionStatusChart';
import { InterviewOutcomeChart } from './InterviewOutcomeChart';
import { InterviewTypeChart } from './InterviewTypeChart';
import { CompanyStatsTable } from './CompanyStatsTable';
import { KeyMetricsCards } from './KeyMetricsCards';
import { DateRangeSelector } from './DateRangeSelector';
import { StatisticsExport } from './StatisticsExport';
import { DrillDownModal } from './DrillDownModal';
import { ResponsiveStatisticsLayout } from './ResponsiveStatisticsLayout';

export const StatisticsOverview: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: '',
    to: '',
  });
  const [drillDown, setDrillDown] = useState<{
    isOpen: boolean;
    type: 'position-status' | 'interview-outcome' | 'interview-type' | 'company';
    value: string;
    label: string;
  }>({
    isOpen: false,
    type: 'position-status',
    value: '',
    label: '',
  });

  // Use filtered data if date range is selected, otherwise use default
  const defaultData = useAnalyticsDashboard();
  const filteredData = useStatsByDateRange(dateRange.from, dateRange.to);
  
  const isUsingDateFilter = dateRange.from && dateRange.to;
  const { overview, successRates, monthlyStats, topCompanies, isLoading, error } = 
    isUsingDateFilter ? {
      overview: filteredData,
      successRates: defaultData.successRates, // Success rates don't change with date filter
      monthlyStats: defaultData.monthlyStats,
      topCompanies: defaultData.topCompanies,
      isLoading: filteredData.isLoading || defaultData.successRates.isLoading,
      error: filteredData.error || defaultData.successRates.error,
    } : defaultData;

  const handleRefresh = () => {
    if (isUsingDateFilter) {
      filteredData.refetch();
    } else {
      defaultData.overview.refetch();
    }
    defaultData.successRates.refetch();
    defaultData.monthlyStats.refetch();
    defaultData.topCompanies.refetch();
  };

  const handleDateRangeApply = () => {
    // The query will automatically refetch when dateRange changes
  };

  const handleDateRangeReset = () => {
    setDateRange({ from: '', to: '' });
  };

  const handleDrillDown = (type: typeof drillDown.type, value: string, label: string) => {
    setDrillDown({
      isOpen: true,
      type,
      value,
      label,
    });
  };

  const handleCloseDrillDown = () => {
    setDrillDown(prev => ({ ...prev, isOpen: false }));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">
            Failed to load statistics
          </div>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <Button onClick={handleRefresh} variant="primary">
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveStatisticsLayout
      onExport={() => {}}
      isLoading={isLoading}
    >
      <div className="space-y-8">
        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Filters & Controls</h2>
              <p className="text-sm text-gray-600 mt-1">
                Customize your statistics view and export data
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <DateRangeSelector
                value={dateRange}
                onChange={setDateRange}
                onApply={handleDateRangeApply}
                onReset={handleDateRangeReset}
                isLoading={isLoading}
              />
              <StatisticsExport
                dateRange={dateRange.from && dateRange.to ? dateRange : undefined}
              />
              <Button
                onClick={handleRefresh}
                variant="secondary"
                disabled={isLoading}
                className="flex items-center justify-center"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Active filters indicator */}
          {isUsingDateFilter && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-800">
                  Showing data from {new Date(dateRange.from).toLocaleDateString()} to {new Date(dateRange.to).toLocaleDateString()}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDateRangeReset}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear Filter
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics Cards */}
        <KeyMetricsCards
          overview={overview.data}
          successRates={successRates.data}
          isLoading={isLoading}
        />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Position Status Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Position Status Breakdown
            </h2>
            <PositionStatusChart
              data={overview.data?.positions_by_status}
              isLoading={overview.isLoading}
              onDrillDown={(status, label) => handleDrillDown('position-status', status, label)}
            />
          </div>

          {/* Interview Outcomes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Interview Outcomes
            </h2>
            <InterviewOutcomeChart
              data={overview.data?.interviews_by_outcome}
              isLoading={overview.isLoading}
              onDrillDown={(outcome, label) => handleDrillDown('interview-outcome', outcome, label)}
            />
          </div>

          {/* Interview Types */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Interview Types Distribution
            </h2>
            <InterviewTypeChart
              data={overview.data?.interviews_by_type}
              isLoading={overview.isLoading}
              onDrillDown={(type, label) => handleDrillDown('interview-type', type, label)}
            />
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Monthly Activity Trends
            </h2>
            {monthlyStats.isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : monthlyStats.data ? (
              <div className="text-sm text-gray-600">
                Monthly trends chart will be implemented in the next phase
              </div>
            ) : (
              <div className="text-sm text-gray-500">No monthly data available</div>
            )}
          </div>
        </div>

        {/* Company Statistics Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Company-wise Statistics
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Application and interview statistics by company
            </p>
          </div>
          <CompanyStatsTable
            companies={overview.data?.companies || []}
            topCompanies={topCompanies.data || []}
            isLoading={overview.isLoading || topCompanies.isLoading}
            onDrillDown={(company, label) => handleDrillDown('company', company, label)}
          />
        </div>

        {/* Drill Down Modal */}
        <DrillDownModal
          isOpen={drillDown.isOpen}
          onClose={handleCloseDrillDown}
          type={drillDown.type}
          value={drillDown.value}
          label={drillDown.label}
        />
      </div>
    </ResponsiveStatisticsLayout>
  );
};