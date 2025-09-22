import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Position, PositionStatus, UpdatePositionData } from '../../types';
import { StatusBadge, Button, Input, TextArea, Select, Modal } from '../ui';
import { cn } from '../../utils';

interface PositionDetailsProps {
  position: Position;
  onEdit: (id: string, data: UpdatePositionData) => void;
  onDelete: (id: string) => void;
  onStatusUpdate: (id: string, status: PositionStatus) => void;
  onAddInterview: (positionId: string) => void;
  loading?: boolean;
  className?: string;
}

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => void;
  type?: 'text' | 'textarea' | 'select';
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onSave,
  type = 'text',
  options,
  placeholder,
  icon,
  required = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (required && !editValue.trim()) {
      return;
    }
    
    setIsLoading(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="flex items-start space-x-2">
          <div className="flex-1">
            {type === 'textarea' ? (
              <TextArea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full"
              />
            ) : type === 'select' && options ? (
              <Select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full"
                options={options}
              />
            ) : (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={placeholder}
                className="w-full"
              />
            )}
          </div>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="primary"
              onClick={handleSave}
              loading={isLoading}
              disabled={required && !editValue.trim()}
            >
              <CheckIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        {icon && <div className="text-gray-400">{icon}</div>}
        <div className="flex-1">
          {value ? (
            <span className="text-gray-900">{value}</span>
          ) : (
            <span className="text-gray-400 italic">Not specified</span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const PositionDetails: React.FC<PositionDetailsProps> = ({
  position,
  onEdit,
  onDelete,
  onStatusUpdate,
  onAddInterview,
  loading = false,
  className,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { label: 'Applied', value: 'applied' },
    { label: 'Screening', value: 'screening' },
    { label: 'Interviewing', value: 'interviewing' },
    { label: 'Offer', value: 'offer' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Withdrawn', value: 'withdrawn' },
  ];

  const handleFieldUpdate = async (field: string, value: string) => {
    setIsUpdating(true);
    try {
      await onEdit(position.id, { [field]: value });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    setIsUpdating(true);
    try {
      await onStatusUpdate(position.id, status as PositionStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    onDelete(position.id);
    setShowDeleteModal(false);
  };

  const applicationDate = parseISO(position.application_date);
  const totalInterviews = position.interviews?.length || 0;
  const upcomingInterviews = position.interviews?.filter(
    (interview) => interview.outcome === 'pending'
  ).length || 0;

  if (loading) {
    return (
      <div className={cn('animate-pulse space-y-6', className)}>
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{position.title}</h1>
          <p className="text-lg text-gray-600 mt-1">{position.company}</p>
        </div>
        <div className="flex items-center space-x-3">
          <StatusBadge status={position.status} />
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            disabled={isUpdating}
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Position Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Position Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            label="Job Title"
            value={position.title}
            onSave={(value) => handleFieldUpdate('title', value)}
            placeholder="Enter job title"
            icon={<DocumentTextIcon className="h-4 w-4" />}
            required
          />

          <EditableField
            label="Company"
            value={position.company}
            onSave={(value) => handleFieldUpdate('company', value)}
            placeholder="Enter company name"
            icon={<BuildingOfficeIcon className="h-4 w-4" />}
            required
          />

          <EditableField
            label="Location"
            value={position.location || ''}
            onSave={(value) => handleFieldUpdate('location', value)}
            placeholder="Enter location"
            icon={<MapPinIcon className="h-4 w-4" />}
          />

          <EditableField
            label="Salary Range"
            value={position.salary_range || ''}
            onSave={(value) => handleFieldUpdate('salary_range', value)}
            placeholder="e.g., $80,000 - $100,000"
            icon={<CurrencyDollarIcon className="h-4 w-4" />}
          />

          <EditableField
            label="Status"
            value={position.status}
            onSave={handleStatusUpdate}
            type="select"
            options={statusOptions}
            icon={<StatusBadge status={position.status} size="sm" />}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application Date
            </label>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {format(applicationDate, 'MMMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <EditableField
            label="Description"
            value={position.description || ''}
            onSave={(value) => handleFieldUpdate('description', value)}
            type="textarea"
            placeholder="Enter job description, requirements, or notes..."
          />
        </div>
      </div>

      {/* Interview Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">
              Interviews ({totalInterviews})
            </h2>
            {upcomingInterviews > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {upcomingInterviews} upcoming
              </span>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onAddInterview(position.id)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Interview
          </Button>
        </div>

        {totalInterviews > 0 ? (
          <div className="space-y-4">
            {position.interviews
              ?.sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
              .map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">
                        {interview.type === 'technical' && '💻'}
                        {interview.type === 'behavioral' && '🗣️'}
                        {interview.type === 'hr' && '👥'}
                        {interview.type === 'final' && '🎯'}
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-900 capitalize">
                          {interview.type} Interview
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            {format(parseISO(interview.scheduled_date), 'MMM d, yyyy \'at\' h:mm a')}
                          </span>
                          <span className="capitalize">{interview.place}</span>
                          {interview.duration_minutes && (
                            <span>{interview.duration_minutes} minutes</span>
                          )}
                        </div>
                        {interview.notes && (
                          <p className="text-sm text-gray-600 mt-1">{interview.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={interview.outcome} size="sm" />
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No interviews yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Get started by scheduling your first interview for this position.
            </p>
            <Button
              variant="primary"
              onClick={() => onAddInterview(position.id)}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Schedule Interview
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Position"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this position? This action cannot be undone.
            All associated interviews will also be deleted.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {position.title} at {position.company}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Position details and description</li>
                    <li>{totalInterviews} interview{totalInterviews !== 1 ? 's' : ''}</li>
                    <li>Application history and notes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Delete Position
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PositionDetails;