import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { Button, Input, Select, DateRangePicker } from '../ui';
import { FilterPresets } from './FilterPresets';
import { PositionFilters, PositionStatus, FilterOption } from '../../types';
import { validateFilters, suggestFilterImprovements, describeFilters } from '../../utils/filterValidation';
import { downloadFiltersAsFile, readFiltersFromFile } from '../../utils/filterExport';
import { cn } from '../../utils';

interface FilterBarProps {
  filters: PositionFilters;
  onFiltersChange: (filters: PositionFilters) => void;
  resultCount?: number;
  loading?: boolean;
  className?: string;
}

const statusOptions: FilterOption[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Applied', value: PositionStatus.APPLIED },
  { label: 'Screening', value: PositionStatus.SCREENING },
  { label: 'Interviewing', value: PositionStatus.INTERVIEWING },
  { label: 'Offer', value: PositionStatus.OFFER },
  { label: 'Rejected', value: PositionStatus.REJECTED },
  { label: 'Withdrawn', value: PositionStatus.WITHDRAWN },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  resultCount,
  loading = false,
  className,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Validation results
  const validationResult = validateFilters(filters);
  const suggestions = resultCount !== undefined ? suggestFilterImprovements(filters, resultCount) : [];
  const filterDescription = describeFilters(filters);

  // Initialize filters from URL on mount
  useEffect(() => {
    const urlFilters: PositionFilters = {};
    
    const status = searchParams.get('status');
    const company = searchParams.get('company');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    if (status) { urlFilters.status = status as PositionStatus; }
    if (company) { urlFilters.company = company; }
    if (search) { urlFilters.search = search; }
    if (dateFrom) { urlFilters.date_from = dateFrom; }
    if (dateTo) { urlFilters.date_to = dateTo; }

    // Only update if there are URL params and they differ from current filters
    if (Object.keys(urlFilters).length > 0) {
      setLocalSearch(search || '');
      onFiltersChange(urlFilters);
    }
  }, []);

  // Update URL when filters change
  const updateURL = useCallback((newFilters: PositionFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.status) { params.set('status', newFilters.status); }
    if (newFilters.company) { params.set('company', newFilters.company); }
    if (newFilters.search) { params.set('search', newFilters.search); }
    if (newFilters.date_from) { params.set('date_from', newFilters.date_from); }
    if (newFilters.date_to) { params.set('date_to', newFilters.date_to); }

    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Handle search input with debouncing
  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      const newFilters: PositionFilters = { ...filters };
      if (value) {
        newFilters.search = value;
      } else {
        delete newFilters.search;
      }
      onFiltersChange(newFilters);
      updateURL(newFilters);
    }, 300);

    setSearchTimeout(timeout);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof PositionFilters, value: string) => {
    const newFilters: PositionFilters = { ...filters };
    if (value) {
      (newFilters as any)[key] = value;
    } else {
      delete (newFilters as any)[key];
    }
    onFiltersChange(newFilters);
    updateURL(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters: PositionFilters = {};
    setLocalSearch('');
    onFiltersChange(clearedFilters);
    setSearchParams({}, { replace: true });
    setShowAdvanced(false);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');
  const activeFilterCount = Object.values(filters).filter(value => value !== undefined && value !== '').length;

  // Check if advanced filters are being used
  const hasAdvancedFilters = filters.date_from || filters.date_to;

  useEffect(() => {
    if (hasAdvancedFilters) {
      setShowAdvanced(true);
    }
  }, [hasAdvancedFilters]);

  // Handle date range changes
  const handleDateRangeChange = (range: { from?: string; to?: string }) => {
    const newFilters: PositionFilters = { ...filters };
    
    if (range.from) {
      newFilters.date_from = range.from;
    } else {
      delete newFilters.date_from;
    }
    
    if (range.to) {
      newFilters.date_to = range.to;
    } else {
      delete newFilters.date_to;
    }
    
    onFiltersChange(newFilters);
    updateURL(newFilters);
  };

  // Handle filter export
  const handleExportFilters = () => {
    downloadFiltersAsFile(filters, undefined, {
      name: 'Position Filters',
      description: filterDescription,
      resultCount,
      exportedBy: 'Interview Position Tracker',
    });
  };

  // Handle filter import
  const handleImportFilters = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    readFiltersFromFile(file)
      .then((importedFilters) => {
        onFiltersChange(importedFilters);
        updateURL(importedFilters);
        // Reset file input
        event.target.value = '';
      })
      .catch((error) => {
        console.error('Failed to import filters:', error);
        // You could show a toast notification here
      });
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 space-y-4', className)}>
      {/* Filter Presets */}
      {showPresets && (
        <div className="p-4 border-b border-gray-200">
          <FilterPresets
            currentFilters={filters}
            onApplyPreset={onFiltersChange}
          />
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Main Filter Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search positions by title, company, or description..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <Select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={statusOptions}
              placeholder="Filter by status"
              disabled={loading}
            />
          </div>

          {/* Company Filter */}
          <div className="w-full sm:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Filter by company"
                value={filters.company || ''}
                onChange={(e) => handleFilterChange('company', e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Presets Toggle */}
            <Button
              variant="ghost"
              onClick={() => setShowPresets(!showPresets)}
              className={cn(
                'flex items-center gap-2',
                showPresets && 'bg-blue-50 text-blue-700 border-blue-200'
              )}
              disabled={loading}
            >
              Presets
            </Button>

            {/* Advanced Filters Toggle */}
            <Button
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                'flex items-center gap-2',
                showAdvanced && 'bg-blue-50 text-blue-700 border-blue-200'
              )}
              disabled={loading}
            >
              <FunnelIcon className="h-4 w-4" />
              Advanced
              {hasAdvancedFilters && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                  {Object.values({ date_from: filters.date_from, date_to: filters.date_to })
                    .filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            {/* Date Range Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Date Range
              </label>
              <DateRangePicker
                value={{
                  from: filters.date_from,
                  to: filters.date_to,
                }}
                onChange={handleDateRangeChange}
                disabled={loading}
                placeholder="Select application date range"
              />
            </div>

            {/* Import/Export Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportFilters}
                  disabled={!hasActiveFilters || loading}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  Export
                </Button>
                
                <label className="cursor-pointer">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loading}
                    className="text-gray-600 hover:text-gray-800"
                    as="span"
                  >
                    <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                    Import
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFilters}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Validation Toggle */}
              {(validationResult.errors.length > 0 || validationResult.warnings.length > 0 || suggestions.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowValidation(!showValidation)}
                  className={cn(
                    'text-gray-600 hover:text-gray-800',
                    validationResult.errors.length > 0 && 'text-red-600 hover:text-red-700',
                    validationResult.warnings.length > 0 && !validationResult.errors.length && 'text-yellow-600 hover:text-yellow-700'
                  )}
                >
                  {validationResult.errors.length > 0 ? (
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  ) : validationResult.warnings.length > 0 ? (
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <LightBulbIcon className="h-4 w-4 mr-1" />
                  )}
                  {validationResult.errors.length > 0 ? 'Issues' : 
                   validationResult.warnings.length > 0 ? 'Warnings' : 'Tips'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Validation Messages */}
        {showValidation && (validationResult.errors.length > 0 || validationResult.warnings.length > 0 || suggestions.length > 0) && (
          <div className="border-t border-gray-200 pt-4 space-y-3">
            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800 mb-1">Filter Issues</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">Warnings</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start">
                  <LightBulbIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Suggestions</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter Summary and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            {/* Result Count */}
            {resultCount !== undefined && (
              <span className="text-sm text-gray-600">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Searching...
                  </span>
                ) : (
                  `${resultCount} position${resultCount !== 1 ? 's' : ''} found`
                )}
              </span>
            )}

            {/* Filter Description */}
            {hasActiveFilters && (
              <span className="text-xs text-gray-500 italic">
                {filterDescription}
              </span>
            )}

            {/* Active Filters Count */}
            {hasActiveFilters && (
              <span className="text-sm text-blue-600 font-medium">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
              </span>
            )}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-gray-500 hover:text-gray-700"
              disabled={loading}
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Clear all filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;