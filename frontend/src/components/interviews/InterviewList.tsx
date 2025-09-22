import React, { useState, useMemo } from 'react';
import { compareAsc } from 'date-fns';
import { 
  PlusIcon, 
  FunnelIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Interview, InterviewType, InterviewOutcome } from '../../types';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import InterviewCard from './InterviewCard';

interface InterviewListProps {
  interviews: Interview[];
  positionId: string;
  onAddNew: () => void;
  onEditInterview: (interview: Interview) => void;
  onDeleteInterview: (id: string) => void;
  onQuickUpdate: (id: string, field: string, value: any) => void;
  loading?: boolean;
  showPositionInfo?: boolean;
}

type SortField = 'scheduled_date' | 'type' | 'outcome' | 'created_at';
type SortOrder = 'asc' | 'desc';

interface FilterState {
  type: InterviewType | 'all';
  outcome: InterviewOutcome | 'all';
  timeframe: 'all' | 'upcoming' | 'past' | 'today';
}

const InterviewList: React.FC<InterviewListProps> = ({
  interviews,

  onAddNew,
  onEditInterview,
  onDeleteInterview,
  onQuickUpdate,
  loading = false,
  showPositionInfo = false,
}) => {
  const [sortField, setSortField] = useState<SortField>('scheduled_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    outcome: 'all',
    timeframe: 'all',
  });

  // Filter and sort interviews
  const filteredAndSortedInterviews = useMemo(() => {
    let filtered = [...interviews];

    // Apply filters
    if (filters.type !== 'all') {
      filtered = filtered.filter(interview => interview.type === filters.type);
    }

    if (filters.outcome !== 'all') {
      filtered = filtered.filter(interview => interview.outcome === filters.outcome);
    }

    if (filters.timeframe !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      filtered = filtered.filter(interview => {
        const interviewDate = new Date(interview.scheduled_date);
        
        switch (filters.timeframe) {
          case 'upcoming':
            return interviewDate >= now && interview.outcome === InterviewOutcome.PENDING;
          case 'past':
            return interviewDate < now || interview.outcome !== InterviewOutcome.PENDING;
          case 'today':
            return interviewDate >= today && interviewDate < tomorrow;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'scheduled_date':
          comparison = compareAsc(new Date(a.scheduled_date), new Date(b.scheduled_date));
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'outcome':
          comparison = a.outcome.localeCompare(b.outcome);
          break;
        case 'created_at':
          comparison = compareAsc(new Date(a.created_at), new Date(b.created_at));
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [interviews, filters, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      outcome: 'all',
      timeframe: 'all',
    });
  };

  const hasActiveFilters = filters.type !== 'all' || filters.outcome !== 'all' || filters.timeframe !== 'all';

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: InterviewType.TECHNICAL, label: 'Technical' },
    { value: InterviewType.BEHAVIORAL, label: 'Behavioral' },
    { value: InterviewType.HR, label: 'HR' },
    { value: InterviewType.FINAL, label: 'Final' },
  ];

  const outcomeOptions = [
    { value: 'all', label: 'All Outcomes' },
    { value: InterviewOutcome.PENDING, label: 'Pending' },
    { value: InterviewOutcome.PASSED, label: 'Passed' },
    { value: InterviewOutcome.FAILED, label: 'Failed' },
    { value: InterviewOutcome.CANCELLED, label: 'Cancelled' },
  ];

  const timeframeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'today', label: 'Today' },
    { value: 'past', label: 'Past' },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">
            Interviews ({filteredAndSortedInterviews.length})
          </h3>
          
          {hasActiveFilters && (
            <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
              Filtered
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`${hasActiveFilters ? 'text-blue-600' : ''}`}
          >
            <FunnelIcon className="h-4 w-4 mr-1" />
            Filters
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            onClick={onAddNew}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Interview
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <Select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                options={typeOptions}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outcome
              </label>
              <Select
                value={filters.outcome}
                onChange={(e) => setFilters(prev => ({ ...prev, outcome: e.target.value as any }))}
                options={outcomeOptions}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeframe
              </label>
              <Select
                value={filters.timeframe}
                onChange={(e) => setFilters(prev => ({ ...prev, timeframe: e.target.value as any }))}
                options={timeframeOptions}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center space-x-4 text-sm">
        <span className="text-gray-600">Sort by:</span>
        
        <button
          onClick={() => handleSort('scheduled_date')}
          className={`flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100 ${
            sortField === 'scheduled_date' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
          }`}
        >
          <CalendarIcon className="h-4 w-4" />
          <span>Date</span>
          {sortField === 'scheduled_date' && (
            sortOrder === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
          )}
        </button>

        <button
          onClick={() => handleSort('type')}
          className={`flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100 ${
            sortField === 'type' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
          }`}
        >
          <span>Type</span>
          {sortField === 'type' && (
            sortOrder === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
          )}
        </button>

        <button
          onClick={() => handleSort('outcome')}
          className={`flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100 ${
            sortField === 'outcome' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
          }`}
        >
          <span>Status</span>
          {sortField === 'outcome' && (
            sortOrder === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
          )}
        </button>

        <button
          onClick={() => handleSort('created_at')}
          className={`flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100 ${
            sortField === 'created_at' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
          }`}
        >
          <ClockIcon className="h-4 w-4" />
          <span>Created</span>
          {sortField === 'created_at' && (
            sortOrder === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Interview List */}
      {filteredAndSortedInterviews.length === 0 ? (
        <div className="text-center py-12">
          {interviews.length === 0 ? (
            <div>
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No interviews scheduled</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by scheduling your first interview.
              </p>
              <div className="mt-6">
                <Button
                  variant="primary"
                  onClick={onAddNew}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Schedule Interview
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <FunnelIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No interviews match your filters</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters or clearing them to see all interviews.
              </p>
              <div className="mt-6">
                <Button
                  variant="secondary"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedInterviews.map((interview) => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              onEdit={onEditInterview}
              onDelete={onDeleteInterview}
              onQuickUpdate={onQuickUpdate}
              showPositionInfo={showPositionInfo}
            />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {interviews.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Interview Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total:</span>
              <span className="ml-1 font-medium">{interviews.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Pending:</span>
              <span className="ml-1 font-medium text-yellow-600">
                {interviews.filter(i => i.outcome === InterviewOutcome.PENDING).length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Passed:</span>
              <span className="ml-1 font-medium text-green-600">
                {interviews.filter(i => i.outcome === InterviewOutcome.PASSED).length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Failed:</span>
              <span className="ml-1 font-medium text-red-600">
                {interviews.filter(i => i.outcome === InterviewOutcome.FAILED).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewList;