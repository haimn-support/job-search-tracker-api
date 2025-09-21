import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { authService } from '../services';
import { queryKeys } from '../lib/queryClient';
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
} from '../types';

// Query hooks
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: () => authService.getCurrentUser(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry auth queries to avoid infinite loops
    enabled: authService.isAuthenticated(),
  });
};

export const useVerifyToken = () => {
  return useQuery({
    queryKey: queryKeys.auth.verify,
    queryFn: () => authService.verifyToken(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    enabled: authService.isAuthenticated(),
  });
};

// Mutation hooks
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data: AuthResponse) => {
      // Set user data in cache
      queryClient.setQueryData(queryKeys.auth.user, data.user);
      queryClient.setQueryData(queryKeys.auth.verify, true);
      
      toast.success(`Welcome back, ${data.user.first_name}!`);
      
      // Prefetch dashboard data after login
      queryClient.prefetchQuery({
        queryKey: queryKeys.statistics.dashboard(),
        queryFn: () => import('../services').then(({ statisticsService }) => statisticsService.getDashboardSummary()),
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Login failed');
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (userData: RegisterData) => authService.register(userData),
    onSuccess: () => {
      toast.success('Registration successful! Please log in.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Registration failed');
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      // Remove user data from cache
      queryClient.removeQueries(queryKeys.auth.user);
      queryClient.removeQueries(queryKeys.auth.verify);
      
      toast.success('Logged out successfully');
    },
    onError: () => {
      // Even if logout API fails, clear local data
      queryClient.clear();
      queryClient.removeQueries(queryKeys.auth.user);
      queryClient.removeQueries(queryKeys.auth.verify);
      
      toast.success('Logged out successfully');
    },
  });
};

export const useRefreshToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.refreshToken(),
    onSuccess: () => {
      // Token refreshed successfully, update verification status
      queryClient.setQueryData(queryKeys.auth.verify, true);
    },
    onError: () => {
      // Refresh failed, clear auth data and redirect to login
      queryClient.clear();
      queryClient.removeQueries(queryKeys.auth.user);
      queryClient.removeQueries(queryKeys.auth.verify);
      
      toast.error('Session expired. Please log in again.');
      
      // Redirect to login page
      window.location.href = '/login';
    },
  });
};

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset(email),
    onSuccess: () => {
      toast.success('Password reset email sent. Please check your inbox.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send password reset email');
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authService.resetPassword(token, newPassword),
    onSuccess: () => {
      toast.success('Password reset successfully. Please log in with your new password.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset password');
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to change password');
    },
  });
};

// Combined hooks and utilities - use AuthContext directly
export const useAuth = () => {
  // Import and use AuthContext directly
  const { useAuthContext } = require('../providers/AuthProvider');
  return useAuthContext();
};

export const useAuthGuard = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    user,
    canAccess: isAuthenticated && !isLoading,
    shouldRedirect: !isAuthenticated && !isLoading,
  };
};

export const useUserProfile = () => {
  const userQuery = useCurrentUser();
  const changePasswordMutation = useChangePassword();
  
  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    error: userQuery.error,
    refetch: userQuery.refetch,
    
    // Password change
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
    changePasswordError: changePasswordMutation.error,
  };
};

// Session management hooks
export const useSessionManager = () => {
  const queryClient = useQueryClient();
  const refreshTokenMutation = useRefreshToken();
  
  const checkSession = async () => {
    if (!authService.isAuthenticated()) {
      return false;
    }
    
    try {
      const isValid = await authService.verifyToken();
      return isValid;
    } catch (error) {
      return false;
    }
  };
  
  const refreshSession = () => {
    refreshTokenMutation.mutate();
  };
  
  const clearSession = () => {
    queryClient.clear();
    queryClient.removeQueries(queryKeys.auth.user);
    queryClient.removeQueries(queryKeys.auth.verify);
  };
  
  return {
    checkSession,
    refreshSession,
    clearSession,
    isRefreshing: refreshTokenMutation.isPending,
  };
};

// Auto-refresh token hook
export const useAutoRefreshToken = () => {
  const refreshTokenMutation = useRefreshToken();
  
  // This would typically be used in a useEffect to set up automatic token refresh
  const setupAutoRefresh = (intervalMinutes: number = 15) => {
    if (!authService.isAuthenticated()) {
      return;
    }
    
    const interval = setInterval(() => {
      if (authService.isAuthenticated()) {
        refreshTokenMutation.mutate();
      } else {
        clearInterval(interval);
      }
    }, intervalMinutes * 60 * 1000);
    
    return () => clearInterval(interval);
  };
  
  return {
    setupAutoRefresh,
    isRefreshing: refreshTokenMutation.isPending,
  };
};