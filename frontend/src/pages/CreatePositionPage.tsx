import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout';
import { PositionForm } from '../components/positions';
import { useCreatePosition } from '../hooks/usePositions';
import { PositionFormData, CreatePositionData } from '../types';

export const CreatePositionPage: React.FC = () => {
  const navigate = useNavigate();
  const createPositionMutation = useCreatePosition();

  const handleSubmit = async (data: PositionFormData) => {
    try {
      const createData: CreatePositionData = {
        title: data.title,
        company: data.company,
        ...(data.description && { description: data.description }),
        ...(data.location && { location: data.location }),
        ...(data.salary_range && { salary_range: data.salary_range }),
        status: data.status,
        application_date: data.application_date,
      };

      const newPosition = await createPositionMutation.mutateAsync(createData);
      
      // Navigate to the new position's details page
      navigate(`/positions/${newPosition.id}`, { 
        replace: true,
        state: { message: 'Position created successfully!' }
      });
    } catch (error) {
      console.error('Failed to create position:', error);
      // Error handling is done in the mutation hook
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-400 hover:text-gray-500"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="flex-shrink-0 h-5 w-5 text-gray-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">
                    Create Position
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Create New Position</h1>
            <p className="mt-2 text-gray-600">
              Add a new job position to track your application progress and interviews.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-8">
            <PositionForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={createPositionMutation.isPending}
            />
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Tips for creating positions</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Use descriptive job titles that match the actual position</li>
            <li>• Include the full company name for better organization</li>
            <li>• Add location details (Remote, Hybrid, or specific city)</li>
            <li>• Paste the job description to reference requirements later</li>
            <li>• Set the correct application date to track your timeline</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreatePositionPage;