import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { 
  Interview, 
  InterviewFormData, 
  InterviewType, 
  InterviewPlace, 
  InterviewOutcome,
  CreateInterviewData,
  UpdateInterviewData
} from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { Select } from '../ui/Select';

interface InterviewFormProps {
  interview?: Interview;
  positionId: string;
  onSubmit: (data: CreateInterviewData | UpdateInterviewData) => void;
  onCancel: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

const InterviewForm: React.FC<InterviewFormProps> = ({
  interview,
  positionId,
  onSubmit,
  onCancel,
  loading = false,
  mode = interview ? 'edit' : 'create',
}) => {
  const [isDraft, setIsDraft] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<InterviewFormData>({
    defaultValues: {
      type: interview?.type || InterviewType.TECHNICAL,
      place: interview?.place || InterviewPlace.VIDEO,
      scheduled_date: interview?.scheduled_date 
        ? format(new Date(interview.scheduled_date), "yyyy-MM-dd'T'HH:mm")
        : '',
      duration_minutes: interview?.duration_minutes || undefined,
      notes: interview?.notes || '',
      outcome: interview?.outcome || InterviewOutcome.PENDING,
    },
  });

  // Auto-save draft functionality
  useEffect(() => {
    if (mode === 'create' && isDirty) {
      const draftKey = `interview-draft-${positionId}`;
      const formData = watch();
      localStorage.setItem(draftKey, JSON.stringify(formData));
      setIsDraft(true);
    }
  }, [watch(), isDirty, mode, positionId]);

  // Load draft on mount for create mode
  useEffect(() => {
    if (mode === 'create') {
      const draftKey = `interview-draft-${positionId}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          Object.keys(draftData).forEach((key) => {
            setValue(key as keyof InterviewFormData, draftData[key]);
          });
          setIsDraft(true);
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    }
  }, [mode, positionId, setValue]);

  const clearDraft = () => {
    if (mode === 'create') {
      const draftKey = `interview-draft-${positionId}`;
      localStorage.removeItem(draftKey);
      setIsDraft(false);
    }
  };

  const onFormSubmit = (data: InterviewFormData) => {
    const submitData = mode === 'create' 
      ? {
          position_id: positionId,
          type: data.type,
          place: data.place,
          scheduled_date: data.scheduled_date,
          duration_minutes: data.duration_minutes || undefined,
          notes: data.notes || undefined,
          outcome: data.outcome,
        } as CreateInterviewData
      : {
          type: data.type,
          place: data.place,
          scheduled_date: data.scheduled_date,
          duration_minutes: data.duration_minutes || undefined,
          notes: data.notes || undefined,
          outcome: data.outcome,
        } as UpdateInterviewData;

    onSubmit(submitData);
    clearDraft();
  };

  const handleCancel = () => {
    if (isDraft) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Are you sure you want to discard them?'
      );
      if (!confirmDiscard) return;
      clearDraft();
    }
    onCancel();
  };

  const typeOptions = [
    { value: InterviewType.TECHNICAL, label: 'Technical Interview' },
    { value: InterviewType.BEHAVIORAL, label: 'Behavioral Interview' },
    { value: InterviewType.HR, label: 'HR Interview' },
    { value: InterviewType.FINAL, label: 'Final Interview' },
  ];

  const placeOptions = [
    { value: InterviewPlace.VIDEO, label: 'Video Call' },
    { value: InterviewPlace.PHONE, label: 'Phone Call' },
    { value: InterviewPlace.ONSITE, label: 'On-site' },
  ];

  const outcomeOptions = [
    { value: InterviewOutcome.PENDING, label: 'Pending' },
    { value: InterviewOutcome.PASSED, label: 'Passed' },
    { value: InterviewOutcome.FAILED, label: 'Failed' },
    { value: InterviewOutcome.CANCELLED, label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {mode === 'create' ? 'Schedule New Interview' : 'Edit Interview'}
        </h3>
        {isDraft && (
          <span className="px-2 py-1 text-xs font-medium text-yellow-600 bg-yellow-100 rounded-full">
            Draft saved
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Interview Type and Place */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interview Type *
            </label>
            <Select
              {...register('type', { required: 'Interview type is required' })}
              options={typeOptions}
              error={errors.type?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interview Format *
            </label>
            <Select
              {...register('place', { required: 'Interview format is required' })}
              options={placeOptions}
              error={errors.place?.message}
            />
          </div>
        </div>

        {/* Scheduled Date and Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scheduled Date & Time *
            </label>
            <Input
              type="datetime-local"
              {...register('scheduled_date', { 
                required: 'Scheduled date is required',
                validate: (value) => {
                  const selectedDate = new Date(value);
                  const now = new Date();
                  if (selectedDate < now && mode === 'create') {
                    return 'Scheduled date cannot be in the past';
                  }
                  return true;
                }
              })}
              error={errors.scheduled_date?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <Input
              type="number"
              min="15"
              max="480"
              step="15"
              placeholder="e.g., 60"
              {...register('duration_minutes', {
                valueAsNumber: true,
                min: { value: 15, message: 'Duration must be at least 15 minutes' },
                max: { value: 480, message: 'Duration cannot exceed 8 hours' },
              })}
              error={errors.duration_minutes?.message}
            />
          </div>
        </div>

        {/* Outcome (only show for edit mode or if interview is in the past) */}
        {(mode === 'edit' || (watch('scheduled_date') && new Date(watch('scheduled_date')) < new Date())) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interview Outcome
            </label>
            <Select
              {...register('outcome')}
              options={outcomeOptions}
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <TextArea
            rows={4}
            placeholder="Add any notes about the interview, preparation items, or follow-up actions..."
            {...register('notes')}
            error={errors.notes?.message}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          
          {isDraft && mode === 'create' && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                clearDraft();
                reset();
              }}
              disabled={loading}
            >
              Clear Draft
            </Button>
          )}
          
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!isDirty && mode === 'edit'}
          >
            {mode === 'create' ? 'Schedule Interview' : 'Update Interview'}
          </Button>
        </div>
      </form>

      {/* Form Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Set reminders in your calendar after scheduling</li>
          <li>• Add preparation notes to help you get ready</li>
          <li>• Update the outcome after the interview is completed</li>
          {mode === 'create' && (
            <li>• Your progress is automatically saved as you type</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default InterviewForm;