import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PositionFilters, PositionStatus } from '../types';

interface UsePositionFiltersReturn {
  filters: PositionFilters;
  setFilters: (filters: PositionFilters) => void;
  updateFilter: (key: keyof PositionFilters, value: string | undefined) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

export const usePositionFilters = (): UsePositionFiltersReturn => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFiltersState] = useState<PositionFilters>(() => {
    // Initialize filters from URL on first render
    const urlFilters: PositionFilters = {};
    
    const status = searchParams.get('status');
    const company = searchParams.get('company');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    if (status && Object.values(PositionStatus).includes(status as PositionStatus)) {
      urlFilters.status = status as PositionStatus;
    }
    if (company) { urlFilters.company = company; }
    if (search) { urlFilters.search = search; }
    if (dateFrom) { urlFilters.date_from = dateFrom; }
    if (dateTo) { urlFilters.date_to = dateTo; }

    return urlFilters;
  });
  
  const isUpdatingFromURL = useRef(false);

  // Update URL when filters change
  const updateURL = useCallback((newFilters: PositionFilters) => {
    if (isUpdatingFromURL.current) return;
    
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value);
      }
    });

    isUpdatingFromURL.current = true;
    setSearchParams(params, { replace: true });
    setTimeout(() => {
      isUpdatingFromURL.current = false;
    }, 0);
  }, [setSearchParams]);

  // Set filters and update URL
  const setFilters = useCallback((newFilters: PositionFilters) => {
    setFiltersState(newFilters);
    updateURL(newFilters);
  }, [updateURL]);

  // Update a single filter
  const updateFilter = useCallback((key: keyof PositionFilters, value: string | undefined) => {
    const newFilters = {
      ...filters,
      [key]: value || undefined,
    };
    
    // Remove undefined values
    Object.keys(newFilters).forEach(k => {
      if (newFilters[k as keyof PositionFilters] === undefined) {
        delete newFilters[k as keyof PositionFilters];
      }
    });
    
    setFilters(newFilters);
  }, [filters, setFilters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFiltersState({});
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== ''
  );

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(value => 
    value !== undefined && value !== ''
  ).length;

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  };
};

export default usePositionFilters;