import { apiRequest } from './httpClient';
import { tokenManager } from '../utils/tokenManager';
import {
  User,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  TokenRefreshResponse,
} from '../types';

class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await apiRequest.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Store tokens and user data
    tokenManager.setTokens(response);

    return response;
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<User> {
    const { confirmPassword, ...registrationData } = userData;
    
    const response = await apiRequest.post<User>('/auth/register', registrationData);
    return response;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if it exists
      await apiRequest.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local tokens
      tokenManager.clearTokens();
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiRequest.get<User>('/auth/me');
    
    // Update stored user data
    tokenManager.setUser(response);
    
    return response;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = tokenManager.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiRequest.post<TokenRefreshResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });

    // Update stored access token
    tokenManager.updateAccessToken(response.access_token);

    return response.access_token;
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated();
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    return tokenManager.getUser();
  }

  /**
   * Verify token validity
   */
  async verifyToken(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    await apiRequest.post('/auth/password-reset-request', { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiRequest.post('/auth/password-reset', {
      token,
      new_password: newPassword,
    });
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiRequest.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;