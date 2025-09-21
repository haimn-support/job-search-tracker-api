import { User, AuthResponse } from '../types';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';
const TOKEN_EXPIRY_KEY = 'token_expiry';

// Token expiry buffer (5 minutes before actual expiry)
const EXPIRY_BUFFER = 5 * 60 * 1000;

export class TokenManager {
  /**
   * Set tokens and user data from auth response
   */
  setTokens(authResponse: AuthResponse): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, authResponse.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user));
      
      // Calculate and store token expiry (assuming 1 hour default)
      const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour from now
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      // Store refresh token if provided
      if ('refresh_token' in authResponse) {
        localStorage.setItem(REFRESH_TOKEN_KEY, (authResponse as any).refresh_token);
      }
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Get stored user data
   */
  getUser(): User | null {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Update stored user data
   */
  setUser(user: User): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired();
  }

  /**
   * Check if token is expired or about to expire
   */
  isTokenExpired(): boolean {
    try {
      const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (!expiryStr) {
        // If no expiry stored, assume token is valid for backward compatibility
        return false;
      }

      const expiry = parseInt(expiryStr, 10);
      const now = Date.now();
      
      // Consider token expired if it expires within the buffer time
      return now >= (expiry - EXPIRY_BUFFER);
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true; // Assume expired on error
    }
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeUntilExpiry(): number {
    try {
      const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (!expiryStr) {
        return 0;
      }

      const expiry = parseInt(expiryStr, 10);
      const now = Date.now();
      
      return Math.max(0, expiry - now);
    } catch (error) {
      console.error('Failed to get time until expiry:', error);
      return 0;
    }
  }

  /**
   * Update access token (for refresh operations)
   */
  updateAccessToken(accessToken: string, expiresIn?: number): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      
      // Update expiry if provided
      if (expiresIn) {
        const expiryTime = Date.now() + (expiresIn * 1000);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      }
    } catch (error) {
      console.error('Failed to update access token:', error);
    }
  }

  /**
   * Clear all stored tokens and user data
   */
  clearTokens(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Get authorization header value
   */
  getAuthHeader(): string | null {
    const token = this.getAccessToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Check if refresh token is available
   */
  hasRefreshToken(): boolean {
    return !!this.getRefreshToken();
  }

  /**
   * Get all stored auth data for debugging
   */
  getAuthData(): {
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isExpired: boolean;
    timeUntilExpiry: number;
  } {
    return {
      accessToken: this.getAccessToken(),
      refreshToken: this.getRefreshToken(),
      user: this.getUser(),
      isAuthenticated: this.isAuthenticated(),
      isExpired: this.isTokenExpired(),
      timeUntilExpiry: this.getTimeUntilExpiry(),
    };
  }

  /**
   * Subscribe to storage changes (for multi-tab sync)
   */
  onStorageChange(callback: (event: StorageEvent) => void): () => void {
    const handler = (event: StorageEvent) => {
      if ([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, TOKEN_EXPIRY_KEY].includes(event.key || '')) {
        callback(event);
      }
    };

    window.addEventListener('storage', handler);
    
    return () => {
      window.removeEventListener('storage', handler);
    };
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
export default tokenManager;