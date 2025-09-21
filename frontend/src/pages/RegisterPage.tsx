import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm';
import { AuthGuard } from '../components/auth/AuthGuard';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRegisterSuccess = () => {
    // Redirect to login page after successful registration
    navigate('/login', { 
      replace: true,
      state: { message: 'Registration successful! Please log in.' }
    });
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
              Start managing your job search today
            </p>
          </div>
          
          <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
            <RegisterForm onSuccess={handleRegisterSuccess} />
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-500 underline font-medium"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default RegisterPage;