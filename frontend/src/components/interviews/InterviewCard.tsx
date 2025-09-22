import React, { useState } from 'react';
import { format, isToday, isPast, isFuture } from 'date-fns';
import { 
  CalendarIcon, 
  ClockIcon, 
  VideoCameraIcon, 
  PhoneIcon, 
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,

} from '@heroicons/react/24/outline';
import { Interview, InterviewType, InterviewPlace, InterviewOutcome } from '../../types';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { useUpdateInterviewField, useDeleteInterview } from '../../hooks/useInterviews';
import InlineDatePicker from './InlineDatePicker';
import InlineStatusSelector from './InlineStatusSelector';
import InterviewQuickActions from './InterviewQuickActions';

interface InterviewCardProps {
  interview: Interview;
  onEdit: (interview: Interview) => void;
  onDelete: (id: string) => void;
  onQuickUpdate: (id: string, field: string, value: any) => void;
  showPositionInfo?: boolean;
  compact?: boolean;
}

const InterviewCard: React.FC<InterviewCardProps> = ({
  interview,
  onEdit,
  onDelete,
  onQuickUpdate,

  compact = false,
}) => {

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  const updateFieldMutation = useUpdateInterviewField();
  const deleteInterviewMutation = useDeleteInterview();

  const scheduledDate = new Date(interview.scheduled_date);
  const isUpcoming = isFuture(scheduledDate) && interview.outcome === InterviewOutcome.PENDING;
  const isOverdue = isPast(scheduledDate) && interview.outcome === InterviewOutcome.PENDING;
  const isTodayInterview = isToday(scheduledDate);

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
        return 'text-blue-600 bg-blue-50';
      case InterviewType.BEHAVIORAL:
        return 'text-green-600 bg-green-50';
      case InterviewType.HR:
        return 'text-purple-600 bg-purple-50';
      case InterviewType.FINAL:
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getCardBorderClass = () => {
    if (isOverdue) return 'border-red-300 bg-red-50';
    if (isTodayInterview) return 'border-yellow-300 bg-yellow-50';
    if (isUpcoming) return 'border-blue-300 bg-blue-50';
    return 'border-gray-200 bg-white';
  };

  const handleFieldEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleFieldSave = async (field: string) => {
    try {
      await updateFieldMutation.mutateAsync({
        id: interview.id,
        field,
        value: tempValue,
      });
      onQuickUpdate(interview.id, field, tempValue);
      setEditingField(null);
    } catch (error) {
      console.error('Failed to update field:', error);
    }
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setTempValue('');
  };

  const handleDelete = async () => {
    try {
      await deleteInterviewMutation.mutateAsync(interview.id);
      onDelete(interview.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete interview:', error);
    }
  };

  if (compact) {
    return (
      <div className={`p-3 rounded-lg border ${getCardBorderClass()} hover:shadow-md transition-shadow`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getPlaceIcon(interview.place)}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(interview.type)}`}>
              {interview.type}
            </span>
            <span className="text-sm text-gray-600">
              {format(scheduledDate, 'MMM d, h:mm a')}
            </span>
          </div>
          <StatusBadge status={interview.outcome} size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${getCardBorderClass()} hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getPlaceIcon(interview.place)}
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${getTypeColor(interview.type)}`}>
            {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview
          </span>
          {(isOverdue || isTodayInterview) && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isOverdue ? 'text-red-600 bg-red-100' : 'text-yellow-600 bg-yellow-100'
            }`}>
              {isOverdue ? 'Overdue' : 'Today'}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(interview)}
            className="p-1"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1 text-red-600 hover:text-red-700"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Date and Time */}
      <div className="mb-3">
        <div className="flex items-center space-x-2 text-sm">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          {editingField === 'scheduled_date' ? (
            <InlineDatePicker
              value={interview.scheduled_date}
              onSave={(newDate) => {
                handleFieldSave('scheduled_date');
                onQuickUpdate(interview.id, 'scheduled_date', newDate);
              }}
              onCancel={handleFieldCancel}
              loading={updateFieldMutation.isPending}
            />
          ) : (
            <button
              onClick={() => handleFieldEdit('scheduled_date', interview.scheduled_date)}
              className="text-gray-900 hover:text-blue-600 transition-colors"
            >
              {format(scheduledDate, 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
            </button>
          )}
        </div>
        
        {interview.duration_minutes && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
            <ClockIcon className="h-4 w-4 text-gray-400" />
            <span>{interview.duration_minutes} minutes</span>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Status:</span>
          {editingField === 'outcome' ? (
            <InlineStatusSelector
              value={interview.outcome}
              onSave={(newStatus) => {
                handleFieldSave('outcome');
                onQuickUpdate(interview.id, 'outcome', newStatus);
              }}
              onCancel={handleFieldCancel}
              loading={updateFieldMutation.isPending}
            />
          ) : (
            <button
              onClick={() => handleFieldEdit('outcome', interview.outcome)}
              className="hover:bg-gray-50 rounded px-1"
            >
              <StatusBadge status={interview.outcome} size="sm" />
            </button>
          )}
        </div>
      </div>

      {/* Notes */}
      {interview.notes && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 line-clamp-2">{interview.notes}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-3">
        <InterviewQuickActions
          interview={interview}
          onEdit={() => onEdit(interview)}
          onDelete={() => setShowDeleteConfirm(true)}
          compact={true}
        />
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-800 mb-2">
            Are you sure you want to delete this interview?
          </p>
          <div className="flex space-x-2">
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={deleteInterviewMutation.isPending}
            >
              Delete
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewCard;