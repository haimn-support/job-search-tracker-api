import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { AuthGuard } from '../components/auth';
import { AppLayout } from '../components/layout';
import { PositionDetails } from '../components/positions';
import { Button } from '../components/ui';
import { 
  usePosition, 
  useUpdatePosition, 
  useDeletePosition, 
  useUpdatePositionStatus 
} from '../hooks/usePositions';
import { PositionStatus, UpdatePositionData } from '../types';

export const PositionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: position, isLoading, error } = usePosition(id!);
  const updatePositionMutation = useUpdatePosition();
  const deletePositionMutation = useDeletePosition();
  const updateStatusMutation = useUpdatePositionStatus();

  const handleEdit = async (positionId: string, data: UpdatePositionData) => {
    try {
      await updatePositionMutation.mutateAsync({ id: positionId, data });
    } catch (error) {
      toast.error('Failed to update position');
      throw error; // Re-throw to let the component handle the error state
    }
  };

  const handleDelete = async (positionId: string) => {
    try {
      await deletePositionMutation.mutateAsync(positionId);
      toast.success('Position deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to delete position');
    }
  };

  const handleStatusUpdate = async (positionId: string, status: PositionStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: positionId, status });
    } catch (error) {
      toast.error('Failed to update position status');
      throw error;
    }
  };

  const handleAddInterview = (_positionId: string) => {
    // TODO: This will be implemented when interview management is added
    // For now, show a placeholder message
    toast('Interview management coming soon!', {
      icon: '🚧',
    });
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (!id) {
    return (
      <AuthGuard>
        <AppLayout>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Position Not Found</h1>
              <p className="text-gray-600 mt-2">The position you're looking for doesn't exist.</p>
              <Button
                variant="primary"
                onClick={handleBack}
                className="mt-4"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <AppLayout>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Error Loading Position</h1>
              <p className="text-gray-600 mt-2">
                There was an error loading the position details. Please try again.
              </p>
              <div className="flex justify-center space-x-4 mt-4">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                >
                  Back to Dashboard
                </Button>
                <Button
                  variant="primary"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with back button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Position Details */}
          {position && (
            <PositionDetails
              position={position}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusUpdate={handleStatusUpdate}
              onAddInterview={handleAddInterview}
              loading={isLoading}
            />
          )}
        </div>
      </AppLayout>
    </AuthGuard>
  );
};

export default PositionDetailsPage;