import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { AuthGuard } from '../components/auth/AuthGuard';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginSuccess = () => {
    // Redirect to the originally requested page or dashboard
    const from = location.state?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
  };

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Interview Tracker
            </h1>
            <p className="text-gray-600">
              Manage your job applications and interviews
            </p>
          </div>
          
          <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>
              By signing in, you agree to our{' '}
              <a
                href="/terms"
                className="text-blue-600 hover:text-blue-500 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                className="text-blue-600 hover:text-blue-500 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default LoginPage;