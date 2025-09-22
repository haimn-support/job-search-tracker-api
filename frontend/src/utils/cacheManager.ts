import { PositionFilters } from '../types';

// Cache configuration for different data types
export const cacheConfigs = {
  // Frequently changing data
  positions: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
  },
  
  // Moderately changing data
  interviews: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
  },
  
  // Rarely changing data
  userProfile: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: false,
  },
  
  // Statistics (expensive to calculate)
  statistics: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
  },
} as const;

// User preferences interface
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  defaultPositionView: 'grid' | 'list';
  defaultPositionSort: string;
  notificationsEnabled: boolean;
  autoRefreshInterval: number;
  compactMode: boolean;
  dateFormat: string;
  timezone: string;
}

// Form draft interface
export interface FormDraft {
  id: string;
  type: 'position' | 'interview';
  data: any;
  timestamp: number;
  expiresAt: number;
}

// Cache entry interface
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  version: string;
  expiresAt?: number;
}

// Browser storage cache manager
export class CacheManager {
  private static readonly VERSION = '1.0';
  private static readonly DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

  // User preferences management
  static setUserPreferences(prefs: Partial<UserPreferences>): void {
    try {
      const existing = this.getUserPreferences();
      const updated = { ...existing, ...prefs };
      localStorage.setItem('user_preferences', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  }

  static getUserPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem('user_preferences');
      if (!stored) {
        return this.getDefaultPreferences();
      }
      
      const parsed = JSON.parse(stored);
      return { ...this.getDefaultPreferences(), ...parsed };
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  private static getDefaultPreferences(): UserPreferences {
    return {
      theme: 'system',
      sidebarCollapsed: false,
      defaultPositionView: 'grid',
      defaultPositionSort: 'updated_at',
      notificationsEnabled: true,
      autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
      compactMode: false,
      dateFormat: 'MM/dd/yyyy',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  // Form drafts management
  static saveDraft(key: string, data: any, type: 'position' | 'interview' = 'position'): void {
    try {
      const draft: FormDraft = {
        id: key,
        type,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      };
      
      localStorage.setItem(`draft_${key}`, JSON.stringify(draft));
      
      // Clean up expired drafts
      this.cleanupExpiredDrafts();
    } catch (error) {
      console.warn('Failed to save draft:', error);
    }
  }

  static getDraft(key: string): FormDraft | null {
    try {
      const stored = localStorage.getItem(`draft_${key}`);
      if (!stored) {
        return null;
      }
      
      const draft: FormDraft = JSON.parse(stored);
      
      // Check if draft has expired
      if (Date.now() > draft.expiresAt) {
        this.clearDraft(key);
        return null;
      }
      
      return draft;
    } catch (error) {
      console.warn('Failed to load draft:', error);
      return null;
    }
  }

  static clearDraft(key: string): void {
    try {
      localStorage.removeItem(`draft_${key}`);
    } catch (error) {
      console.warn('Failed to clear draft:', error);
    }
  }

  static getAllDrafts(): FormDraft[] {
    const drafts: FormDraft[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('draft_')) {
          const draft = this.getDraft(key.replace('draft_', ''));
          if (draft) {
            drafts.push(draft);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load drafts:', error);
    }
    
    return drafts.sort((a, b) => b.timestamp - a.timestamp);
  }

  private static cleanupExpiredDrafts(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('draft_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const draft: FormDraft = JSON.parse(stored);
            if (Date.now() > draft.expiresAt) {
              keysToRemove.push(key);
            }
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to cleanup expired drafts:', error);
    }
  }

  // Filter states management
  static saveFilters(filters: PositionFilters): void {
    try {
      localStorage.setItem('position_filters', JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save filters:', error);
    }
  }

  static getFilters(): PositionFilters | null {
    try {
      const stored = localStorage.getItem('position_filters');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load filters:', error);
      return null;
    }
  }

  static clearFilters(): void {
    try {
      localStorage.removeItem('position_filters');
    } catch (error) {
      console.warn('Failed to clear filters:', error);
    }
  }

  // Generic cache persistence
  static save<T>(key: string, data: T, maxAge: number = this.DEFAULT_MAX_AGE): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: this.VERSION,
        expiresAt: Date.now() + maxAge,
      };
      
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
      // If localStorage is full, try to clear some space
      this.clearExpiredCache();
    }
  }

  static load<T>(key: string, maxAge: number = this.DEFAULT_MAX_AGE): T | null {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);

      // Check version compatibility
      if (entry.version !== this.VERSION) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      // Check if cache has expired
      const isExpired = entry.expiresAt 
        ? Date.now() > entry.expiresAt 
        : Date.now() - entry.timestamp > maxAge;
        
      if (isExpired) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to load cache:', error);
      return null;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Failed to remove cache:', error);
    }
  }

  static clearExpiredCache(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const entry: CacheEntry = JSON.parse(stored);
              const isExpired = entry.expiresAt 
                ? Date.now() > entry.expiresAt 
                : Date.now() - entry.timestamp > this.DEFAULT_MAX_AGE;
                
              if (isExpired || entry.version !== this.VERSION) {
                keysToRemove.push(key);
              }
            } catch {
              // Invalid cache entry, remove it
              keysToRemove.push(key);
            }
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear expired cache:', error);
    }
  }

  static clearAllCache(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache_') || key?.startsWith('draft_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear all cache:', error);
    }
  }

  // Cache size management
  static getCacheSize(): { totalSize: number; itemCount: number } {
    let totalSize = 0;
    let itemCount = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache_') || key?.startsWith('draft_') || key === 'user_preferences' || key === 'position_filters') {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += new Blob([value]).size;
            itemCount++;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to calculate cache size:', error);
    }
    
    return { totalSize, itemCount };
  }

  // Initialize cache manager
  static initialize(): void {
    // Clean up expired items on initialization
    this.cleanupExpiredDrafts();
    this.clearExpiredCache();
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupExpiredDrafts();
      this.clearExpiredCache();
    }, 60 * 60 * 1000); // Every hour
  }
}

// Session storage cache manager for temporary data
export class SessionCache {
  // Navigation state management
  static saveScrollPosition(route: string, position: number): void {
    try {
      sessionStorage.setItem(`scroll_${route}`, position.toString());
    } catch (error) {
      console.warn('Failed to save scroll position:', error);
    }
  }

  static getScrollPosition(route: string): number {
    try {
      const stored = sessionStorage.getItem(`scroll_${route}`);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.warn('Failed to load scroll position:', error);
      return 0;
    }
  }

  // Form state management
  static saveFormState(formId: string, state: any): void {
    try {
      sessionStorage.setItem(`form_${formId}`, JSON.stringify({
        state,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('Failed to save form state:', error);
    }
  }

  static getFormState(formId: string): any | null {
    try {
      const stored = sessionStorage.getItem(`form_${formId}`);
      if (!stored) {
        return null;
      }
      
      const { state, timestamp } = JSON.parse(stored);
      
      // Expire form state after 1 hour
      if (Date.now() - timestamp > 60 * 60 * 1000) {
        sessionStorage.removeItem(`form_${formId}`);
        return null;
      }
      
      return state;
    } catch (error) {
      console.warn('Failed to load form state:', error);
      return null;
    }
  }

  static clearFormState(formId: string): void {
    try {
      sessionStorage.removeItem(`form_${formId}`);
    } catch (error) {
      console.warn('Failed to clear form state:', error);
    }
  }

  // Tab state management
  static saveTabState(tabId: string, state: any): void {
    try {
      sessionStorage.setItem(`tab_${tabId}`, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save tab state:', error);
    }
  }

  static getTabState(tabId: string): any | null {
    try {
      const stored = sessionStorage.getItem(`tab_${tabId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load tab state:', error);
      return null;
    }
  }

  // Clear all session data
  static clearAll(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('Failed to clear session storage:', error);
    }
  }
}

// Initialize cache manager when module is loaded
if (typeof window !== 'undefined') {
  CacheManager.initialize();
}