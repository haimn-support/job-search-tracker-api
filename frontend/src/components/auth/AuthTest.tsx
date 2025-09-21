import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui';

export const AuthTest: React.FC = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  const handleTestLogin = async () => {
    try {
      await login({
        email: 'test@example.com',
        password: 'password123',
      });
    } catch (error) {
      console.error('Login test failed:', error);
    }
  };

  const handleTestLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout test failed:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Authentication Test</h3>
      
      <div className="space-y-2 mb-4">
        <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        <p>User: {user ? `${user.first_name} ${user.last_name} (${user.email})` : 'None'}</p>
      </div>

      <div className="space-x-2">
        <Button onClick={handleTestLogin} disabled={isAuthenticated}>
          Test Login
        </Button>
        <Button onClick={handleTestLogout} disabled={!isAuthenticated} variant="secondary">
          Test Logout
        </Button>
      </div>
    </div>
  );
};

export default AuthTest;