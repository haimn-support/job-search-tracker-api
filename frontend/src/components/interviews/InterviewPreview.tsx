import React from 'react';
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import { 
  CalendarIcon, 
  VideoCameraIcon, 
  PhoneIcon, 
  BuildingOfficeIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Interview, InterviewType, InterviewPlace, InterviewOutcome } from '../../types';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import InterviewTooltip from './InterviewTooltip';

interface InterviewPreviewProps {
  interviews: Interview[];
  positionId: string;
  onAddInterview: (positionId: string) => void;
  onInterviewClick?: (interview: Interview) => void;
  maxVisible?: number;
  showAddButton?: boolean;
}

const InterviewPreview: React.FC<InterviewPreviewProps> = ({
  interviews,
  positionId,
  onAddInterview,
  onInterviewClick,
  maxVisible = 3,
  showAddButton = true,
}) => {
  const getPlaceIcon = (place: InterviewPlace, className = "h-3 w-3") => {
    switch (place) {
      case InterviewPlace.VIDEO:
        return <VideoCameraIcon className={className} />;
      case InterviewPlace.PHONE:
        return <PhoneIcon className={className} />;
      case InterviewPlace.ONSITE:
        return <BuildingOfficeIcon className={className} />;
      default:
        return <CalendarIcon className={className} />;
    }
  };

  const getTypeColor = (type: InterviewType) => {
    switch (type) {
      case InterviewType.TECHNICAL:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case InterviewType.BEHAVIORAL:
        return 'text-green-600 bg-green-50 border-green-200';
      case InterviewType.HR:
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case InterviewType.FINAL:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getInterviewStatus = (interview: Interview) => {
    const scheduledDate = new Date(interview.scheduled_date);
    const isUpcoming = isFuture(scheduledDate) && interview.outcome === InterviewOutcome.PENDING;
    const isOverdue = isPast(scheduledDate) && interview.outcome === InterviewOutcome.PENDING;
    const isTodayInterview = isToday(scheduledDate);
    const isTomorrowInterview = isTomorrow(scheduledDate);

    if (isOverdue) return { type: 'overdue', label: 'Overdue', color: 'text-red-600' };
    if (isTodayInterview) return { type: 'today', label: 'Today', color: 'text-yellow-600' };
    if (isTomorrowInterview) return { type: 'tomorrow', label: 'Tomorrow', color: 'text-blue-600' };
    if (isUpcoming) return { type: 'upcoming', label: 'Upcoming', color: 'text-green-600' };
    return { type: 'completed', label: 'Completed', color: 'text-gray-600' };
  };

  // Sort interviews by date (upcoming first, then by scheduled date)
  const sortedInterviews = [...interviews].sort((a, b) => {
    const aDate = new Date(a.scheduled_date);
    const bDate = new Date(b.scheduled_date);


    // Pending interviews first
    if (a.outcome === InterviewOutcome.PENDING && b.outcome !== InterviewOutcome.PENDING) return -1;
    if (b.outcome === InterviewOutcome.PENDING && a.outcome !== InterviewOutcome.PENDING) return 1;

    // Then by date
    return aDate.getTime() - bDate.getTime();
  });

  const visibleInterviews = sortedInterviews.slice(0, maxVisible);
  const remainingCount = Math.max(0, interviews.length - maxVisible);

  // Get next upcoming interview
  const nextInterview = sortedInterviews.find(
    interview => interview.outcome === InterviewOutcome.PENDING && 
    isFuture(new Date(interview.scheduled_date))
  );

  // Count overdue interviews
  const overdueCount = interviews.filter(
    interview => interview.outcome === InterviewOutcome.PENDING && 
    isPast(new Date(interview.scheduled_date))
  ).length;

  if (interviews.length === 0) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">No interviews scheduled</span>
        {showAddButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddInterview(positionId)}
            className="text-blue-600 hover:text-blue-700 p-1"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Summary Stats */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <span className="text-gray-600">
            {interviews.length} interview{interviews.length !== 1 ? 's' : ''}
          </span>
          
          {nextInterview && (
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-3 w-3 text-blue-500" />
              <span className="text-blue-600">
                Next: {format(new Date(nextInterview.scheduled_date), 'MMM d')}
              </span>
            </div>
          )}

          {overdueCount > 0 && (
            <div className="flex items-center space-x-1">
              <ExclamationTriangleIcon className="h-3 w-3 text-red-500" />
              <span className="text-red-600">
                {overdueCount} overdue
              </span>
            </div>
          )}
        </div>

        {showAddButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddInterview(positionId)}
            className="text-blue-600 hover:text-blue-700 p-1"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Interview List */}
      <div className="space-y-1">
        {visibleInterviews.map((interview) => {
          const status = getInterviewStatus(interview);
          const scheduledDate = new Date(interview.scheduled_date);

          return (
            <InterviewTooltip key={interview.id} interview={interview}>
              <div
                className={`flex items-center justify-between p-2 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getTypeColor(interview.type)}`}
                onClick={() => onInterviewClick?.(interview)}
              >
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  {getPlaceIcon(interview.place)}
                  <span className="text-xs font-medium truncate">
                    {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}
                  </span>
                  <span className="text-xs text-gray-600">
                    {format(scheduledDate, 'MMM d, h:mm a')}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {status.type === 'overdue' && (
                    <ExclamationTriangleIcon className="h-3 w-3 text-red-500" />
                  )}
                  {status.type === 'today' && (
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  )}
                  <StatusBadge status={interview.outcome} size="sm" />
                </div>
              </div>
            </InterviewTooltip>
          );
        })}

        {/* Show remaining count */}
        {remainingCount > 0 && (
          <div className="text-xs text-gray-500 text-center py-1">
            +{remainingCount} more interview{remainingCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPreview;