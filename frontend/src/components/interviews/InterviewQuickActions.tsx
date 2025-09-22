import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Interview, InterviewOutcome } from '../../types';
import { Button } from '../ui/Button';
import { 
  useUpdateInterviewOutcome, 
  useRescheduleInterview,
  useCancelInterview,
  useCompleteInterview
} from '../../hooks/useInterviews';

interface InterviewQuickActionsProps {
  interview: Interview;
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean;
}

const InterviewQuickActions: React.FC<InterviewQuickActionsProps> = ({
  interview,
  onEdit,
  onDelete,
  compact = false,
}) => {
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeOutcome, setCompleteOutcome] = useState<InterviewOutcome.PASSED | InterviewOutcome.FAILED>(InterviewOutcome.PASSED);

  const updateOutcomeMutation = useUpdateInterviewOutcome();
  const rescheduleMutation = useRescheduleInterview();
  const cancelMutation = useCancelInterview();
  const completeMutation = useCompleteInterview();

  const isPending = interview.outcome === InterviewOutcome.PENDING;
  const isPast = new Date(interview.scheduled_date) < new Date();
  const canComplete = isPending && isPast;
  const canReschedule = isPending;

  const handleMarkPassed = async () => {
    try {
      await updateOutcomeMutation.mutateAsync({
        id: interview.id,
        outcome: InterviewOutcome.PASSED,
      });
    } catch (error) {
      console.error('Failed to mark as passed:', error);
    }
  };

  const handleMarkFailed = async () => {
    try {
      await updateOutcomeMutation.mutateAsync({
        id: interview.id,
        outcome: InterviewOutcome.FAILED,
      });
    } catch (error) {
      console.error('Failed to mark as failed:', error);
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Reason for cancellation (optional):');
    try {
      await cancelMutation.mutateAsync({
        id: interview.id,
        ...(reason && { reason }),
      });
    } catch (error) {
      console.error('Failed to cancel interview:', error);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate) return;
    
    try {
      await rescheduleMutation.mutateAsync({
        id: interview.id,
        newDate: new Date(rescheduleDate).toISOString(),
        ...(rescheduleNotes && { notes: rescheduleNotes }),
      });
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setRescheduleNotes('');
    } catch (error) {
      console.error('Failed to reschedule interview:', error);
    }
  };

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync({
        id: interview.id,
        outcome: completeOutcome,
        ...(completeNotes && { notes: completeNotes }),
      });
      setShowCompleteModal(false);
      setCompleteNotes('');
    } catch (error) {
      console.error('Failed to complete interview:', error);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        {canComplete && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkPassed}
              loading={updateOutcomeMutation.isPending}
              className="p-1 text-green-600 hover:text-green-700"
              title="Mark as Passed"
            >
              <CheckCircleIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkFailed}
              loading={updateOutcomeMutation.isPending}
              className="p-1 text-red-600 hover:text-red-700"
              title="Mark as Failed"
            >
              <XCircleIcon className="h-4 w-4" />
            </Button>
          </>
        )}
        
        {canReschedule && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRescheduleModal(true)}
            className="p-1 text-blue-600 hover:text-blue-700"
            title="Reschedule"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="p-1 text-gray-600 hover:text-gray-700"
          title="Edit"
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Quick Status Updates */}
      {canComplete && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Quick update:</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkPassed}
            loading={updateOutcomeMutation.isPending}
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Mark Passed
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkFailed}
            loading={updateOutcomeMutation.isPending}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <XCircleIcon className="h-4 w-4 mr-1" />
            Mark Failed
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCompleteModal(true)}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Complete with Notes
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {canReschedule && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowRescheduleModal(true)}
            loading={rescheduleMutation.isPending}
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Reschedule
          </Button>
        )}

        {isPending && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCancel}
            loading={cancelMutation.isPending}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <XCircleIcon className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={onEdit}
        >
          <PencilIcon className="h-4 w-4 mr-1" />
          Edit Details
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onDelete}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <TrashIcon className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Reschedule Interview
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Reason for rescheduling..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleDate('');
                  setRescheduleNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReschedule}
                loading={rescheduleMutation.isPending}
                disabled={!rescheduleDate}
              >
                Reschedule
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Complete Interview
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outcome
                </label>
                <select
                  value={completeOutcome}
                  onChange={(e) => setCompleteOutcome(e.target.value as InterviewOutcome.PASSED | InterviewOutcome.FAILED)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={InterviewOutcome.PASSED}>Passed</option>
                  <option value={InterviewOutcome.FAILED}>Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="How did the interview go? Any feedback or next steps..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCompleteModal(false);
                  setCompleteNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleComplete}
                loading={completeMutation.isPending}
              >
                Complete Interview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewQuickActions;