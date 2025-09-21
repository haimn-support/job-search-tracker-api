import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { PositionStatus, InterviewOutcome } from '../../types';

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full font-medium',
  {
    variants: {
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-2.5 py-1.5 text-sm',
      },
      variant: {
        // Position status variants
        applied: 'bg-blue-100 text-blue-800',
        screening: 'bg-yellow-100 text-yellow-800',
        interviewing: 'bg-purple-100 text-purple-800',
        offer: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        withdrawn: 'bg-gray-100 text-gray-800',
        // Interview outcome variants
        pending: 'bg-yellow-100 text-yellow-800',
        passed: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-100 text-gray-800',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'applied',
    },
  }
);

// Status display labels
const statusLabels: Record<PositionStatus | InterviewOutcome, string> = {
  // Position statuses
  [PositionStatus.APPLIED]: 'Applied',
  [PositionStatus.SCREENING]: 'Screening',
  [PositionStatus.INTERVIEWING]: 'Interviewing',
  [PositionStatus.OFFER]: 'Offer',
  [PositionStatus.REJECTED]: 'Rejected',
  [PositionStatus.WITHDRAWN]: 'Withdrawn',
  // Interview outcomes
  [InterviewOutcome.PENDING]: 'Pending',
  [InterviewOutcome.PASSED]: 'Passed',
  [InterviewOutcome.FAILED]: 'Failed',
  [InterviewOutcome.CANCELLED]: 'Cancelled',
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  status: PositionStatus | InterviewOutcome;
  showIcon?: boolean;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, size, showIcon = false, ...props }, ref) => {
    const variant = status as any; // Type assertion for variant matching
    const label = statusLabels[status];

    // Status icons
    const getStatusIcon = (status: PositionStatus | InterviewOutcome) => {
      switch (status) {
        case PositionStatus.APPLIED:
          return (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          );
        case PositionStatus.SCREENING:
        case InterviewOutcome.PENDING:
          return (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          );
        case PositionStatus.INTERVIEWING:
          return (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        case PositionStatus.OFFER:
        case InterviewOutcome.PASSED:
          return (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          );
        case PositionStatus.REJECTED:
        case InterviewOutcome.FAILED:
          return (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          );
        case PositionStatus.WITHDRAWN:
        case InterviewOutcome.CANCELLED:
          return (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          );
        default:
          return null;
      }
    };

    return (
      <span
        className={cn(statusBadgeVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {showIcon && getStatusIcon(status)}
        {label}
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export { StatusBadge, statusBadgeVariants };
export default StatusBadge;