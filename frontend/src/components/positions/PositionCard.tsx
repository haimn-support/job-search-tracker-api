import React, { useState } from 'react';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { 
  CalendarIcon, 
  BuildingOfficeIcon, 
  MapPinIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Position, Interview, InterviewType, InterviewOutcome } from '../../types';
import { StatusBadge, Button } from '../ui';
import { cn } from '../../utils';

interface PositionCardProps {
  position: Position;
  onEdit: (position: Position) => void;
  onDelete: (id: string) => void;
  onAddInterview: (positionId: string) => void;
  onViewDetails: (id: string) => void;
  className?: string;
}

const getInterviewTypeIcon = (type: InterviewType) => {
  switch (type) {
    case 'technical':
      return '💻';
    case 'behavioral':
      return '🗣️';
    case 'hr':
      return '👥';
    case 'final':
      return '🎯';
    default:
      return '📋';
  }
};

const getInterviewOutcomeColor = (outcome: InterviewOutcome) => {
  switch (outcome) {
    case 'passed':
      return 'text-green-600';
    case 'failed':
      return 'text-red-600';
    case 'cancelled':
      return 'text-gray-500';
    default:
      return 'text-blue-600';
  }
};

const InterviewPreview: React.FC<{ interview: Interview }> = ({ interview }) => {
  const scheduledDate = parseISO(interview.scheduled_date);
  const isOverdue = isPast(scheduledDate) && interview.outcome === 'pending';
  const isTodayInterview = isToday(scheduledDate);

  return (
    <div
      data-testid="interview-preview"
      className={cn(
        'flex items-center space-x-2 p-2 rounded-md text-sm',
        isOverdue && 'bg-red-50 border border-red-200',
        isTodayInterview && 'bg-yellow-50 border border-yellow-200',
        !isOverdue && !isTodayInterview && 'bg-gray-50'
      )}
      title={`${interview.type} interview - ${format(scheduledDate, 'PPP')} at ${format(scheduledDate, 'p')}`}
    >
      <span className="text-lg">{getInterviewTypeIcon(interview.type)}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-1">
          <span className="font-medium">{interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}</span>
          <span className={cn('text-xs', getInterviewOutcomeColor(interview.outcome))}>
            ({interview.outcome})
          </span>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <CalendarIcon className="h-3 w-3" />
          <span>{format(scheduledDate, 'MMM d, h:mm a')}</span>
          {interview.duration_minutes && (
            <>
              <ClockIcon className="h-3 w-3 ml-1" />
              <span>{interview.duration_minutes}m</span>
            </>
          )}
        </div>
      </div>
      {isOverdue && (
        <span className="text-xs font-medium text-red-600">Overdue</span>
      )}
      {isTodayInterview && (
        <span className="text-xs font-medium text-blue-600">Today</span>
      )}
    </div>
  );
};

export const PositionCard: React.FC<PositionCardProps> = ({
  position,
  onEdit,
  onDelete,
  onAddInterview,
  onViewDetails,
  className,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const upcomingInterviews = position.interviews
    ?.filter(interview => interview.outcome === 'pending')
    ?.sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
    ?.slice(0, 2) || [];

  const totalInterviews = position.interviews?.length || 0;
  const applicationDate = parseISO(position.application_date);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, [role="button"]')) {
      return;
    }
    onViewDetails(position.id);
  };

  const handleAddInterview = () => {
    onAddInterview(position.id);
  };

  return (
    <div
      role="article"
      aria-label={`Position: ${position.title} at ${position.company}`}
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg active:shadow-lg transition-all duration-200 cursor-pointer touch-manipulation',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {position.title}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <BuildingOfficeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 truncate">{position.company}</span>
            </div>
            {position.location && (
              <div className="flex items-center space-x-2 mt-1">
                <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 truncate">{position.location}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <StatusBadge status={position.status} size="sm" />
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                aria-label="Position options menu"
                className="p-2 sm:p-1 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
              >
                <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit(position);
                    }}
                    aria-label={`Edit position ${position.title}`}
                    className="block w-full text-left px-4 py-3 sm:py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    Edit Position
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onAddInterview(position.id);
                    }}
                    aria-label={`Add interview for ${position.title}`}
                    className="block w-full text-left px-4 py-3 sm:py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    Add Interview
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete(position.id);
                    }}
                    aria-label={`Delete position ${position.title}`}
                    className="block w-full text-left px-4 py-3 sm:py-2 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 touch-manipulation"
                  >
                    Delete Position
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        {/* Application Date and Salary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 mb-3 space-y-1 sm:space-y-0">
          <div className="flex items-center space-x-1">
            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
            <span>Applied {format(applicationDate, 'MMM d, yyyy')}</span>
          </div>
          {position.salary_range && (
            <span className="font-medium text-gray-700 text-xs sm:text-sm">{position.salary_range}</span>
          )}
        </div>

        {/* Description */}
        {position.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
            {position.description}
          </p>
        )}

        {/* Interview Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                {totalInterviews === 1 ? '1 interview' : `${totalInterviews} interviews`}
              </span>
            </div>
            {totalInterviews === 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddInterview();
                }}
                aria-label={`Add first interview for ${position.title}`}
                className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Add Interview</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )}
          </div>

          {/* Interview Previews */}
          {upcomingInterviews.length > 0 ? (
            <div className="space-y-2">
              {upcomingInterviews.map((interview) => (
                <InterviewPreview key={interview.id} interview={interview} />
              ))}
              {totalInterviews > 2 && (
                <div className="text-xs text-gray-500 text-center py-1">
                  +{totalInterviews - 2} more interviews
                </div>
              )}
            </div>
          ) : totalInterviews > 0 ? (
            <div className="text-sm text-gray-500 py-2">
              All interviews completed
            </div>
          ) : (
            <div className="text-sm text-gray-400 py-3 sm:py-2 text-center border-2 border-dashed border-gray-200 rounded-md">
              No interviews scheduled
            </div>
          )}
        </div>
      </div>

      {/* Click overlay for better UX */}
      <div className="absolute inset-0 rounded-lg pointer-events-none" />
    </div>
  );
};

export default PositionCard;