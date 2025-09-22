import React from 'react';
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Position, PositionFilters } from '../../types';
import { Button } from '../ui';
import { SwipeableCard } from '../ui/SwipeableCard';
import { PullToRefresh } from '../ui/PullToRefresh';
import { MobileListSkeleton } from '../ui/MobileLoadingStates';
import { PositionCard } from './PositionCard';
import { FilterBar } from './FilterBar';
import { NoResultsState } from './NoResultsState';
import { cn } from '../../utils';

interface PositionListProps {
  positions: Position[];
  loading: boolean;
  error?: string | null;
  filters?: PositionFilters;
  onFiltersChange?: (filters: PositionFilters) => void;
  onCreateNew: () => void;
  onEditPosition: (position: Position) => void;
  onDeletePosition: (id: string) => void;
  onAddInterview: (positionId: string) => void;
  onViewDetails: (id: string) => void;
  onRefresh?: () => Promise<void> | void;
  showFilters?: boolean;
  className?: string;
}

const LoadingSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
    <MobileListSkeleton count={6} />
  </div>
);

const EmptyState: React.FC<{ onCreateNew: () => void }> = ({ onCreateNew }) => (
  <div className="text-center py-12">
    <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
      <svg
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        className="h-full w-full"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      No positions yet
    </h3>
    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
      Start tracking your job applications by creating your first position.
    </p>
    <Button onClick={onCreateNew} size="lg">
      <PlusIcon className="h-5 w-5 mr-2" />
      Create Your First Position
    </Button>
  </div>
);

const ErrorState: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="text-center py-12">
    <div className="mx-auto h-24 w-24 text-red-300 mb-4">
      <svg
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        className="h-full w-full"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Failed to load positions
    </h3>
    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
      {error || 'Something went wrong while loading your positions.'}
    </p>
    <Button onClick={onRetry} variant="secondary">
      Try Again
    </Button>
  </div>
);



export const PositionList: React.FC<PositionListProps> = ({
  positions,
  loading,
  error,
  filters = {},
  onFiltersChange,
  onCreateNew,
  onEditPosition,
  onDeletePosition,
  onAddInterview,
  onViewDetails,
  onRefresh,
  showFilters = true,
  className,
}) => {
  const handleRetry = () => {
    // This will be handled by the parent component through refetch
    window.location.reload();
  };

  const handleClearFilters = () => {
    if (onFiltersChange) {
      onFiltersChange({});
    }
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== ''
  );

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('space-y-6', className)}>
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Show FilterBar even when no results if filters are enabled */}
        {showFilters && onFiltersChange && (
          <FilterBar
            filters={filters}
            onFiltersChange={onFiltersChange}
            resultCount={0}
            loading={loading}
          />
        )}
        
        {hasActiveFilters ? (
          <NoResultsState
            filters={filters}
            onClearFilters={handleClearFilters}
            onCreateNew={onCreateNew}
          />
        ) : (
          <EmptyState onCreateNew={onCreateNew} />
        )}
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Filter Bar */}
      {showFilters && onFiltersChange && (
        <FilterBar
          filters={filters}
          onFiltersChange={onFiltersChange}
          resultCount={positions.length}
          loading={loading}
        />
      )}

      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Your Positions ({positions.length})
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage your job applications
          </p>
        </div>
        <Button onClick={onCreateNew} className="w-full sm:w-auto">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Position
        </Button>
      </div>

      {/* Position Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {positions.map((position) => (
          <SwipeableCard
            key={position.id}
            leftAction={{
              icon: <PencilIcon className="h-5 w-5" />,
              label: 'Edit',
              color: 'blue',
              action: () => onEditPosition(position),
            }}
            rightAction={{
              icon: <CalendarIcon className="h-5 w-5" />,
              label: 'Interview',
              color: 'green',
              action: () => onAddInterview(position.id),
            }}
          >
            <PositionCard
              position={position}
              onEdit={onEditPosition}
              onDelete={onDeletePosition}
              onAddInterview={onAddInterview}
              onViewDetails={onViewDetails}
            />
          </SwipeableCard>
        ))}
      </div>

      {/* Load More or Pagination could go here */}
      {positions.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Showing {positions.length} position{positions.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {onRefresh ? (
        <PullToRefresh onRefresh={onRefresh} className="min-h-screen">
          {content}
        </PullToRefresh>
      ) : (
        content
      )}
    </div>
  );
};

export default PositionList;