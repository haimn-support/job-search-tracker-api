import React, { useState } from 'react';
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import { 
  CalendarIcon, 
  ClockIcon, 
  VideoCameraIcon, 
  PhoneIcon, 
  BuildingOfficeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Interview, InterviewType, InterviewPlace, InterviewOutcome } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';

interface InterviewTooltipProps {
  interview: Interview;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const InterviewTooltip: React.FC<InterviewTooltipProps> = ({
  interview,
  children,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const scheduledDate = new Date(interview.scheduled_date);
  const isUpcoming = isFuture(scheduledDate) && interview.outcome === InterviewOutcome.PENDING;
  const isOverdue = isPast(scheduledDate) && interview.outcome === InterviewOutcome.PENDING;
  const isTodayInterview = isToday(scheduledDate);
  const isTomorrowInterview = isTomorrow(scheduledDate);

  const getPlaceIcon = (place: InterviewPlace) => {
    switch (place) {
      case InterviewPlace.VIDEO:
        return <VideoCameraIcon className="h-4 w-4" />;
      case InterviewPlace.PHONE:
        return <PhoneIcon className="h-4 w-4" />;
      case InterviewPlace.ONSITE:
        return <BuildingOfficeIcon className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: InterviewType) => {
    switch (type) {
      case InterviewType.TECHNICAL:
        return 'text-blue-600';
      case InterviewType.BEHAVIORAL:
        return 'text-green-600';
      case InterviewType.HR:
        return 'text-purple-600';
      case InterviewType.FINAL:
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getDateDescription = () => {
    if (isTodayInterview) return 'Today';
    if (isTomorrowInterview) return 'Tomorrow';
    if (isOverdue) return 'Overdue';
    if (isUpcoming) return 'Upcoming';
    return 'Past';
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 border-t-8 border-x-transparent border-x-8 border-b-0';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800 border-b-8 border-x-transparent border-x-8 border-t-0';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800 border-l-8 border-y-transparent border-y-8 border-r-0';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800 border-r-8 border-y-transparent border-y-8 border-l-0';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 border-t-8 border-x-transparent border-x-8 border-b-0';
    }
  };

  const handleMouseEnter = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const id = setTimeout(() => {
      setIsVisible(true);
    }, 300); // 300ms delay
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div className={`absolute z-50 ${getPositionClasses()}`}>
          {/* Tooltip Content */}
          <div className="bg-gray-800 text-white text-sm rounded-lg p-4 shadow-lg max-w-xs">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getPlaceIcon(interview.place)}
                <span className={`font-medium ${getTypeColor(interview.type)}`}>
                  {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}
                </span>
              </div>
              <StatusBadge status={interview.outcome} size="sm" />
            </div>

            {/* Date and Time */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-gray-300" />
                <div>
                  <div className="font-medium">
                    {format(scheduledDate, 'EEEE, MMMM d')}
                  </div>
                  <div className="text-xs text-gray-300">
                    {format(scheduledDate, 'h:mm a')} • {getDateDescription()}
                  </div>
                </div>
              </div>

              {interview.duration_minutes && (
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-gray-300" />
                  <span className="text-xs text-gray-300">
                    {interview.duration_minutes} minutes
                  </span>
                </div>
              )}
            </div>

            {/* Format */}
            <div className="mb-3">
              <div className="flex items-center space-x-2">
                {getPlaceIcon(interview.place)}
                <span className="text-xs text-gray-300 capitalize">
                  {interview.place.replace('_', ' ')} interview
                </span>
              </div>
            </div>

            {/* Notes Preview */}
            {interview.notes && (
              <div className="border-t border-gray-600 pt-2">
                <div className="flex items-start space-x-2">
                  <InformationCircleIcon className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-300 line-clamp-3">
                    {interview.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Status Indicators */}
            {(isOverdue || isTodayInterview || isTomorrowInterview) && (
              <div className="border-t border-gray-600 pt-2 mt-2">
                <div className={`text-xs font-medium ${
                  isOverdue ? 'text-red-400' : 
                  isTodayInterview ? 'text-yellow-400' : 
                  'text-blue-400'
                }`}>
                  {isOverdue && '⚠️ Overdue - Update status'}
                  {isTodayInterview && '📅 Today - Don\'t forget!'}
                  {isTomorrowInterview && '⏰ Tomorrow - Prepare now'}
                </div>
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className={`absolute w-0 h-0 ${getArrowClasses()}`}></div>
        </div>
      )}
    </div>
  );
};

export default InterviewTooltip;