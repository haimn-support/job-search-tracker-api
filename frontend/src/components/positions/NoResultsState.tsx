import React from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui';
import { PositionFilters } from '../../types';

interface NoResultsStateProps {
  filters: PositionFilters;
  onClearFilters: () => void;
  onCreateNew?: () => void;
}

export const NoResultsState: React.FC<NoResultsStateProps> = ({
  filters,
  onClearFilters,
  onCreateNew,
}) => {
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== ''
  );

  const getFilterSummary = () => {
    const activeFilters = [];
    if (filters.search) { activeFilters.push(`"${filters.search}"`); }
    if (filters.status) { activeFilters.push(`status: ${filters.status}`); }
    if (filters.company) { activeFilters.push(`company: ${filters.company}`); }
    if (filters.date_from || filters.date_to) {
      const dateRange = [];
      if (filters.date_from) { dateRange.push(`from ${filters.date_from}`); }
      if (filters.date_to) { dateRange.push(`to ${filters.date_to}`); }
      activeFilters.push(`date ${dateRange.join(' ')}`);
    }
    return activeFilters.join(', ');
  };

  return (
    <div className="text-center py-12">
      <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
        <MagnifyingGlassIcon className="h-full w-full" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No positions found
      </h3>
      
      {hasActiveFilters ? (
        <>
          <p className="text-gray-500 mb-2 max-w-md mx-auto">
            No positions match your current filters:
          </p>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto font-mono bg-gray-50 px-3 py-2 rounded">
            {getFilterSummary()}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="secondary"
              onClick={onClearFilters}
              className="flex items-center gap-2"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear filters
            </Button>
            {onCreateNew && (
              <Button onClick={onCreateNew}>
                Create new position
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            You haven't created any positions yet. Start tracking your job applications by creating your first position.
          </p>
          {onCreateNew && (
            <Button onClick={onCreateNew} size="lg">
              Create Your First Position
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default NoResultsState;