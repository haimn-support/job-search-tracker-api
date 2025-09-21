import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthGuard } from '../components/auth/AuthGuard';
import { useAuth } from '../hooks/useAuth';
import { usePositions } from '../hooks/usePositions';
import { Button } from '../components/ui';
import { PositionList, DashboardSummary } from '../components';
import { Position } from '../types';

export const DashboardPage: React.FC = () => {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  
  // Fetch positions data
  const { 
    data: positionsResponse, 
    isLoading: positionsLoading, 
    error: positionsError
  } = usePositions();

  const positions = positionsResponse?.positions || [];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCreateNew = () => {
    navigate('/positions/create');
  };

  const handleEditPosition = (position: Position) => {
    // TODO: Navigate to edit position page or open modal
    console.log('Edit position:', position.id);
    navigate(`/positions/${position.id}/edit`);
  };

  const handleDeletePosition = (id: string) => {
    // TODO: Show confirmation dialog and delete
    console.log('Delete position:', id);
    if (window.confirm('Are you sure you want to delete this position?')) {
      // Delete logic will be implemented in task 5.3
    }
  };

  const handleAddInterview = (positionId: string) => {
    // TODO: Navigate to add interview page or open modal
    console.log('Add interview for position:', positionId);
    navigate(`/positions/${positionId}/interviews/new`);
  };

  const handleViewDetails = (id: string) => {
    // TODO: Navigate to position details page
    console.log('View position details:', id);
    navigate(`/positions/${id}`);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Interview Position Tracker
                </h1>
                <p className="text-gray-600">
                  Welcome back, {user?.first_name} {user?.last_name}!
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleLogout}
                loading={authLoading}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 space-y-8">
            {/* Dashboard Summary */}
            <DashboardSummary 
              positions={positions}
              loading={positionsLoading}
            />

            {/* Position List */}
            <PositionList
              positions={positions}
              loading={positionsLoading}
              error={positionsError ? String(positionsError) : null}
              onCreateNew={handleCreateNew}
              onEditPosition={handleEditPosition}
              onDeletePosition={handleDeletePosition}
              onAddInterview={handleAddInterview}
              onViewDetails={handleViewDetails}
            />
          </div>
        </div>


      </div>
    </AuthGuard>
  );
};

export default DashboardPage;