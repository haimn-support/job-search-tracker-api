import React from 'react';
import { AuthGuard } from '../components/auth/AuthGuard';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui';

export const DashboardPage: React.FC = () => {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
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
                variant="outline"
                onClick={handleLogout}
                loading={isLoading}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Dashboard Coming Soon
                </h2>
                <p className="text-gray-600 mb-6">
                  Your job application tracking dashboard will be available here.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>User ID: {user?.id}</p>
                  <p>Email: {user?.email}</p>
                  <p>Member since: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default DashboardPage;