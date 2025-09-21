import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout';
import { PositionForm } from '../components/positions';
import { usePosition, useUpdatePosition } from '../hooks/usePositions';
import { PositionFormData, UpdatePositionData } from '../types';

export const EditPositionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: position, isLoading, error } = usePosition(id!);
  const updatePositionMutation = useUpdatePosition();

  const handleSubmit = async (data: PositionFormData) => {
    if (!id) {
      return;
    }

    try {
      const updateData: UpdatePositionData = {
        title: data.title,
        company: data.company,
        ...(data.description && { description: data.description }),
        ...(data.location && { location: data.location }),
        ...(data.salary_range && { salary_range: data.salary_range }),
        status: data.status,
        application_date: data.application_date,
      };

      await updatePositionMutation.mutateAsync({ id, data: updateData });
      
      // Navigate back to position details
      navigate(`/positions/${id}`, { 
        replace: true,
        state: { message: 'Position updated successfully!' }
      });
    } catch (error) {
      console.error('Failed to update position:', error);
      // Error handling is done in the mutation hook
    }
  };

  const handleCancel = () => {
    if (id) {
      navigate(`/positions/${id}`);
    } else {
      navigate('/dashboard');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="space-y-6">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error || !position) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Position not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The position you're looking for doesn't exist or you don't have permission to edit it.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

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
                  <button
                    onClick={() => navigate(`/positions/${id}`)}
                    className="ml-4 text-gray-400 hover:text-gray-500"
                  >
                    {position.title}
                  </button>
                </div>
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
                    Edit
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Edit Position</h1>
            <p className="mt-2 text-gray-600">
              Update the details for <span className="font-medium">{position.title}</span> at{' '}
              <span className="font-medium">{position.company}</span>.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-8">
            <PositionForm
              position={position}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={updatePositionMutation.isPending}
            />
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-amber-900 mb-2">Editing tips</h3>
          <ul className="text-amber-800 space-y-1 text-sm">
            <li>• Changes are saved immediately when you submit the form</li>
            <li>• Update the status as your application progresses</li>
            <li>• Add or modify the job description with new information</li>
            <li>• Keep salary range updated if you learn more details</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
};

export default EditPositionPage;