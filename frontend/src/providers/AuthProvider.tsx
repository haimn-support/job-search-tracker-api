import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { authService } from '../services';
import { queryKeys } from '../lib/queryClient';
import { sessionPersistence } from '../utils/sessionPersistence';
import {
  User,
  AuthResponse,
  LoginCredentials,
  RegisterData,
} from '../types';

// Auth Context Types
interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  
  // Session management
  checkSession: () => Promise<boolean>;
  restoreSession: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: React.ReactNode;
}

// Token refresh interval (15 minutes)
const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Computed state
  const isAuthenticated = !!user && authService.isAuthenticated();

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check session validity
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      if (!authService.isAuthenticated()) {
        return false;
      }

      const isValid = await authService.verifyToken();
      return isValid;
    } catch (error) {
      console.warn('Session check failed:', error);
      return false;
    }
  }, []);

  // Restore session from storage
  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if session should be restored
      if (!sessionPersistence.shouldRestoreSession()) {
        sessionPersistence.clearSessionState();
        setIsInitialized(true);
        return;
      }

      // Try to get current user
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      
      // Update session state
      sessionPersistence.saveSessionState(true, currentUser.id, currentUser.email);
      
      // Update query cache
      queryClient.setQueryData(queryKeys.auth.user, currentUser);
      queryClient.setQueryData(queryKeys.auth.verify, true);

    } catch (error: any) {
      console.warn('Session restoration failed:', error);
      
      // Clear invalid session
      authService.logout();
      sessionPersistence.clearSessionState();
      setUser(null);
      queryClient.removeQueries(queryKeys.auth.user);
      queryClient.removeQueries(queryKeys.auth.verify);
      
      setError('Session expired. Please log in again.');
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [queryClient]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response: AuthResponse = await authService.login(credentials);
      
      setUser(response.user);
      
      // Update session state
      sessionPersistence.saveSessionState(true, response.user.id, response.user.email);
      
      // Update query cache
      queryClient.setQueryData(queryKeys.auth.user, response.user);
      queryClient.setQueryData(queryKeys.auth.verify, true);
      
      toast.success(`Welcome back, ${response.user.first_name}!`);
      
      // Prefetch dashboard data after login
      queryClient.prefetchQuery({
        queryKey: queryKeys.statistics.dashboard(),
        queryFn: () => import('../services').then(({ statisticsService }) => 
          statisticsService.getDashboardSummary()
        ),
      });

    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  // Register function
  const register = useCallback(async (userData: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { confirmPassword, ...registrationData } = userData;
      await authService.register(registrationData);
      
      toast.success('Registration successful! Please log in.');
      
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local state
      setUser(null);
      sessionPersistence.clearSessionState();
      
      // Clear all cached data
      queryClient.clear();
      queryClient.removeQueries(queryKeys.auth.user);
      queryClient.removeQueries(queryKeys.auth.verify);
      
      toast.success('Logged out successfully');
      setIsLoading(false);
    }
  }, [queryClient]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      await authService.refreshToken();
      
      // Update verification status
      queryClient.setQueryData(queryKeys.auth.verify, true);
      
      console.log('Token refreshed successfully');
      
    } catch (error: any) {
      console.warn('Token refresh failed:', error);
      
      // Clear auth data and redirect to login
      setUser(null);
      sessionPersistence.clearSessionState();
      queryClient.clear();
      queryClient.removeQueries(queryKeys.auth.user);
      queryClient.removeQueries(queryKeys.auth.verify);
      
      setError('Session expired. Please log in again.');
      toast.error('Session expired. Please log in again.');
      
      // Redirect to login page
      window.location.href = '/login';
    }
  }, [queryClient]);

  // Auto-refresh token setup
  useEffect(() => {
    if (!isAuthenticated || !isInitialized) {
      return;
    }

    const interval = setInterval(() => {
      if (authService.isAuthenticated()) {
        refreshToken();
      }
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated, isInitialized, refreshToken]);

  // Initialize auth state on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Set up activity tracking
  useEffect(() => {
    if (!isAuthenticated || !isInitialized) {
      return;
    }

    const cleanup = sessionPersistence.setupActivityTracking();
    return cleanup;
  }, [isAuthenticated, isInitialized]);

  // Set up session timeout warning
  useEffect(() => {
    if (!isAuthenticated || !isInitialized) {
      return;
    }

    const cleanup = sessionPersistence.setupSessionTimeoutWarning(() => {
      toast.error('Your session will expire soon. Please save your work.', {
        duration: 10000,
      });
    });

    return cleanup;
  }, [isAuthenticated, isInitialized]);

  // Handle browser storage events (for multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'access_token' || event.key === 'user') {
        if (!event.newValue) {
          // Token was removed in another tab
          setUser(null);
          queryClient.clear();
        } else if (event.newValue && !user) {
          // Token was added in another tab
          restoreSession();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, queryClient, restoreSession]);

  // Handle page visibility change (refresh token when page becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        checkSession().then(isValid => {
          if (!isValid) {
            refreshToken();
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, checkSession, refreshToken]);

  // Context value
  const contextValue: AuthContextType = {
    // State
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    
    // Actions
    login,
    register,
    logout,
    refreshToken,
    clearError,
    
    // Session management
    checkSession,
    restoreSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthProvider;