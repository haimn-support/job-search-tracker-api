import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, TextArea, Select, MobileForm, MobileFormActions } from '../ui';
import { PositionFormData, PositionStatus, Position } from '../../types';

interface PositionFormProps {
  position?: Position;
  onSubmit: (data: PositionFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

const statusOptions = [
  { value: PositionStatus.APPLIED, label: 'Applied' },
  { value: PositionStatus.SCREENING, label: 'Screening' },
  { value: PositionStatus.INTERVIEWING, label: 'Interviewing' },
  { value: PositionStatus.OFFER, label: 'Offer' },
  { value: PositionStatus.REJECTED, label: 'Rejected' },
  { value: PositionStatus.WITHDRAWN, label: 'Withdrawn' },
];

const getFormattedDate = (dateString?: string): string => {
  if (!dateString) {
    return new Date().toISOString().split('T')[0] || '';
  }
  return dateString.includes('T') ? (dateString.split('T')[0] || '') : dateString;
};

export const PositionForm: React.FC<PositionFormProps> = ({
  position,
  onSubmit,
  onCancel,
  loading = false,
  className = '',
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    setValue,
    watch,
    reset,
    clearErrors,
  } = useForm<PositionFormData>({
    defaultValues: {
      title: position?.title || '',
      company: position?.company || '',
      description: position?.description || '',
      location: position?.location || '',
      salary_range: position?.salary_range || '',
      status: position?.status || PositionStatus.APPLIED,
      application_date: getFormattedDate(position?.application_date),
    },
  });

  // Auto-save draft functionality
  const formData = watch();
  
  useEffect(() => {
    if (isDirty && !position) {
      // Save draft to localStorage for new positions
      const draftKey = 'position-form-draft';
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [formData, isDirty, position]);

  // Load draft on mount for new positions
  useEffect(() => {
    if (!position) {
      const draftKey = 'position-form-draft';
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          Object.keys(draft).forEach((key) => {
            setValue(key as keyof PositionFormData, draft[key]);
          });
        } catch (error) {
          console.warn('Failed to load form draft:', error);
        }
      }
    }
  }, [position, setValue]);

  const onFormSubmit = async (data: PositionFormData) => {
    try {
      clearErrors();
      await onSubmit(data);
      
      // Clear draft after successful submission
      if (!position) {
        localStorage.removeItem('position-form-draft');
      }
      
      // Reset form for new positions
      if (!position) {
        reset();
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleCancel = () => {
    // Clear draft when canceling new position
    if (!position) {
      localStorage.removeItem('position-form-draft');
    }
    onCancel();
  };

  const clearDraft = () => {
    localStorage.removeItem('position-form-draft');
    reset();
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 sm:p-6 ${className}`}>
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-2 sm:space-y-0">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          {position ? 'Edit Position' : 'Create New Position'}
        </h2>
        {!position && isDirty && (
          <button
            type="button"
            onClick={clearDraft}
            className="text-sm text-gray-500 hover:text-gray-700 self-start sm:self-auto"
          >
            Clear Draft
          </button>
        )}
      </div>

      <MobileForm onSubmit={handleSubmit(onFormSubmit)}>

        {/* Job Title */}
        <div>
          <Input
            label="Job Title"
            placeholder="e.g. Senior Software Engineer"
            error={errors.title?.message}
            required
            {...register('title', {
              required: 'Job title is required',
              minLength: {
                value: 2,
                message: 'Job title must be at least 2 characters',
              },
              maxLength: {
                value: 200,
                message: 'Job title must be less than 200 characters',
              },
            })}
          />
        </div>

        {/* Company */}
        <div>
          <Input
            label="Company"
            placeholder="e.g. Google, Microsoft, Startup Inc."
            error={errors.company?.message}
            required
            {...register('company', {
              required: 'Company name is required',
              minLength: {
                value: 2,
                message: 'Company name must be at least 2 characters',
              },
              maxLength: {
                value: 100,
                message: 'Company name must be less than 100 characters',
              },
            })}
          />
        </div>

        {/* Location and Salary Range Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <Input
              label="Location"
              placeholder="e.g. San Francisco, CA or Remote"
              error={errors.location?.message}
              {...register('location', {
                maxLength: {
                  value: 100,
                  message: 'Location must be less than 100 characters',
                },
              })}
            />
          </div>
          <div>
            <Input
              label="Salary Range"
              placeholder="e.g. $120k - $150k or Negotiable"
              error={errors.salary_range?.message}
              {...register('salary_range', {
                maxLength: {
                  value: 50,
                  message: 'Salary range must be less than 50 characters',
                },
              })}
            />
          </div>
        </div>

        {/* Status and Application Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <Select
              label="Status"
              options={statusOptions}
              error={errors.status?.message}
              required
              {...register('status', {
                required: 'Status is required',
              })}
            />
          </div>
          <div>
            <Input
              type="date"
              label="Application Date"
              error={errors.application_date?.message}
              required
              {...register('application_date', {
                required: 'Application date is required',
                validate: (value) => {
                  const date = new Date(value);
                  if (isNaN(date.getTime())) {
                    return 'Invalid date format';
                  }
                  if (date > new Date()) {
                    return 'Application date cannot be in the future';
                  }
                  return true;
                },
              })}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <TextArea
            label="Job Description"
            placeholder="Paste the job description here or add your own notes about the role..."
            rows={6}
            error={errors.description?.message}
            {...register('description', {
              maxLength: {
                value: 2000,
                message: 'Description must be less than 2000 characters',
              },
            })}
          />
          <p className="mt-1 text-sm text-gray-500">
            Optional: Add job requirements, responsibilities, or your notes about the position
          </p>
        </div>

        {/* Form Actions */}
        <MobileFormActions sticky className="pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={loading || isSubmitting}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading || isSubmitting}
            disabled={loading || isSubmitting}
            className="flex-1 sm:flex-none"
          >
            {loading || isSubmitting
              ? position
                ? 'Updating...'
                : 'Creating...'
              : position
              ? 'Update Position'
              : 'Create Position'}
          </Button>
        </MobileFormActions>

        {/* Draft indicator */}
        {!position && isDirty && (
          <div className="text-sm text-gray-500 text-center pb-4">
            <span className="inline-flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Draft saved automatically
            </span>
          </div>
        )}
      </MobileForm>
    </div>
  );
};

export default PositionForm;