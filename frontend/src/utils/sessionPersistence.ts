import { tokenManager } from './tokenManager';

// Session storage keys
const SESSION_STATE_KEY = 'session_state';
const LAST_ACTIVITY_KEY = 'last_activity';

// Session timeout (24 hours)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

interface SessionState {
  isAuthenticated: boolean;
  lastActivity: number;
  userId?: string | undefined;
  userEmail?: string | undefined;
}

export class SessionPersistence {
  /**
   * Save session state
   */
  saveSessionState(isAuthenticated: boolean, userId?: string, userEmail?: string): void {
    try {
      const sessionState: SessionState = {
        isAuthenticated,
        lastActivity: Date.now(),
        userId,
        userEmail,
      };

      localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(sessionState));
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to save session state:', error);
    }
  }

  /**
   * Get session state
   */
  getSessionState(): SessionState | null {
    try {
      const sessionStateStr = localStorage.getItem(SESSION_STATE_KEY);
      return sessionStateStr ? JSON.parse(sessionStateStr) : null;
    } catch (error) {
      console.error('Failed to get session state:', error);
      return null;
    }
  }

  /**
   * Check if session is valid (not expired)
   */
  isSessionValid(): boolean {
    try {
      const sessionState = this.getSessionState();
      if (!sessionState) {
        return false;
      }

      const now = Date.now();
      const timeSinceLastActivity = now - sessionState.lastActivity;

      return timeSinceLastActivity < SESSION_TIMEOUT;
    } catch (error) {
      console.error('Failed to check session validity:', error);
      return false;
    }
  }

  /**
   * Update last activity timestamp
   */
  updateLastActivity(): void {
    try {
      const sessionState = this.getSessionState();
      if (sessionState) {
        sessionState.lastActivity = Date.now();
        localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(sessionState));
      }
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  }

  /**
   * Clear session state
   */
  clearSessionState(): void {
    try {
      localStorage.removeItem(SESSION_STATE_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    } catch (error) {
      console.error('Failed to clear session state:', error);
    }
  }

  /**
   * Get time since last activity
   */
  getTimeSinceLastActivity(): number {
    try {
      const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (!lastActivityStr) {
        return Infinity;
      }

      const lastActivity = parseInt(lastActivityStr, 10);
      return Date.now() - lastActivity;
    } catch (error) {
      console.error('Failed to get time since last activity:', error);
      return Infinity;
    }
  }

  /**
   * Check if session should be restored
   */
  shouldRestoreSession(): boolean {
    const sessionState = this.getSessionState();
    const hasTokens = tokenManager.isAuthenticated();
    const isSessionValid = this.isSessionValid();

    return !!(sessionState?.isAuthenticated && hasTokens && isSessionValid);
  }

  /**
   * Set up activity tracking
   */
  setupActivityTracking(): () => void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    let activityTimeout: NodeJS.Timeout;

    const updateActivity = () => {
      // Debounce activity updates to avoid excessive localStorage writes
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        this.updateLastActivity();
      }, 1000);
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Cleanup function
    return () => {
      clearTimeout(activityTimeout);
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }

  /**
   * Set up session timeout warning
   */
  setupSessionTimeoutWarning(
    warningCallback: () => void,
    warningTimeBeforeExpiry: number = 5 * 60 * 1000 // 5 minutes
  ): () => void {
    let warningTimeout: NodeJS.Timeout;

    const checkSessionExpiry = () => {
      const timeSinceLastActivity = this.getTimeSinceLastActivity();
      const timeUntilExpiry = SESSION_TIMEOUT - timeSinceLastActivity;

      if (timeUntilExpiry <= warningTimeBeforeExpiry && timeUntilExpiry > 0) {
        warningCallback();
        clearInterval(checkInterval); // Stop checking after warning
      } else if (timeUntilExpiry <= 0) {
        // Session expired
        this.clearSessionState();
        tokenManager.clearTokens();
        clearInterval(checkInterval);
      }
    };

    // Check every minute
    const checkInterval = setInterval(checkSessionExpiry, 60 * 1000);

    // Cleanup function
    return () => {
      clearTimeout(warningTimeout);
      clearInterval(checkInterval);
    };
  }

  /**
   * Extend session (reset activity timer)
   */
  extendSession(): void {
    this.updateLastActivity();
  }

  /**
   * Get session info for debugging
   */
  getSessionInfo(): {
    sessionState: SessionState | null;
    isValid: boolean;
    timeSinceLastActivity: number;
    timeUntilExpiry: number;
    shouldRestore: boolean;
  } {
    const sessionState = this.getSessionState();
    const timeSinceLastActivity = this.getTimeSinceLastActivity();
    
    return {
      sessionState,
      isValid: this.isSessionValid(),
      timeSinceLastActivity,
      timeUntilExpiry: SESSION_TIMEOUT - timeSinceLastActivity,
      shouldRestore: this.shouldRestoreSession(),
    };
  }
}

// Export singleton instance
export const sessionPersistence = new SessionPersistence();
export default sessionPersistence;