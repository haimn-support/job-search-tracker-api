import { QueryClient } from '@tanstack/react-query';
import { CacheManager } from './cacheManager';

// Cache persistence configuration
interface PersistenceConfig {
  version: string;
  maxAge: number;
  compress: boolean;
  includeQueries: string[];
  excludeQueries: string[];
}

// Default persistence configuration
const DEFAULT_CONFIG: PersistenceConfig = {
  version: '1.0',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  compress: false,
  includeQueries: [
    'positions',
    'interviews',
    'statistics',
    'auth',
  ],
  excludeQueries: [
    'temp',
    'draft',
  ],
};

// Persisted cache entry
interface PersistedCacheEntry {
  queryKey: any[];
  data: any;
  timestamp: number;
  version: string;
  dataUpdatedAt: number;
  staleTime?: number;
}

// Cache persistence manager
export class CachePersistence {
  private static readonly CACHE_KEY = 'react_query_cache';
  private static readonly CONFIG_KEY = 'cache_persistence_config';
  private static config: PersistenceConfig = DEFAULT_CONFIG;

  // Set persistence configuration
  static setConfig(config: Partial<PersistenceConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
  }

  // Get persistence configuration
  static getConfig(): PersistenceConfig {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load cache persistence config:', error);
    }
    return this.config;
  }

  // Check if query should be persisted
  private static shouldPersistQuery(queryKey: any[]): boolean {
    const keyString = JSON.stringify(queryKey);
    
    // Check exclude patterns
    if (this.config.excludeQueries.some(pattern => keyString.includes(pattern))) {
      return false;
    }

    // Check include patterns
    if (this.config.includeQueries.length > 0) {
      return this.config.includeQueries.some(pattern => keyString.includes(pattern));
    }

    return true;
  }

  // Persist query client cache
  static persistCache(queryClient: QueryClient): void {
    try {
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.getAll();
      
      const persistedEntries: PersistedCacheEntry[] = [];

      queries.forEach(query => {
        if (
          query.state.data !== undefined &&
          query.state.status === 'success' &&
          this.shouldPersistQuery(query.queryKey)
        ) {
          const entry: PersistedCacheEntry = {
            queryKey: query.queryKey,
            data: query.state.data,
            timestamp: Date.now(),
            version: this.config.version,
            dataUpdatedAt: query.state.dataUpdatedAt,
            staleTime: query.options.staleTime,
          };

          persistedEntries.push(entry);
        }
      });

      const cacheData = {
        entries: persistedEntries,
        timestamp: Date.now(),
        version: this.config.version,
      };

      const serialized = this.config.compress 
        ? this.compressData(JSON.stringify(cacheData))
        : JSON.stringify(cacheData);

      localStorage.setItem(this.CACHE_KEY, serialized);
      
      console.log(`Persisted ${persistedEntries.length} cache entries`);
    } catch (error) {
      console.error('Failed to persist cache:', error);
    }
  }

  // Restore query client cache
  static restoreCache(queryClient: QueryClient): void {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (!stored) {
        return;
      }

      const serialized = this.config.compress 
        ? this.decompressData(stored)
        : stored;

      const cacheData = JSON.parse(serialized);

      // Check version compatibility
      if (cacheData.version !== this.config.version) {
        console.log('Cache version mismatch, clearing persisted cache');
        localStorage.removeItem(this.CACHE_KEY);
        return;
      }

      // Check if cache is too old
      if (Date.now() - cacheData.timestamp > this.config.maxAge) {
        console.log('Persisted cache is too old, clearing');
        localStorage.removeItem(this.CACHE_KEY);
        return;
      }

      const queryCache = queryClient.getQueryCache();
      let restoredCount = 0;

      cacheData.entries.forEach((entry: PersistedCacheEntry) => {
        try {
          // Check if entry is still valid
          const entryAge = Date.now() - entry.dataUpdatedAt;
          const isStale = entry.staleTime ? entryAge > entry.staleTime : false;

          if (!isStale || entryAge < this.config.maxAge) {
            queryCache.build(queryClient, {
              queryKey: entry.queryKey,
              queryFn: () => Promise.resolve(entry.data),
            }).setData(entry.data, {
              updatedAt: entry.dataUpdatedAt,
            });

            restoredCount++;
          }
        } catch (error) {
          console.warn('Failed to restore cache entry:', entry.queryKey, error);
        }
      });

      console.log(`Restored ${restoredCount} cache entries from persistence`);
    } catch (error) {
      console.error('Failed to restore cache:', error);
      // Clear corrupted cache
      localStorage.removeItem(this.CACHE_KEY);
    }
  }

  // Clear persisted cache
  static clearPersistedCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }

  // Get persisted cache size
  static getPersistedCacheSize(): { size: number; entryCount: number } {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (!stored) {
        return { size: 0, entryCount: 0 };
      }

      const serialized = this.config.compress 
        ? this.decompressData(stored)
        : stored;

      const cacheData = JSON.parse(serialized);
      
      return {
        size: new Blob([stored]).size,
        entryCount: cacheData.entries?.length || 0,
      };
    } catch (error) {
      console.warn('Failed to get persisted cache size:', error);
      return { size: 0, entryCount: 0 };
    }
  }

  // Compress data (simple base64 compression)
  private static compressData(data: string): string {
    try {
      return btoa(data);
    } catch (error) {
      console.warn('Failed to compress data:', error);
      return data;
    }
  }

  // Decompress data
  private static decompressData(data: string): string {
    try {
      return atob(data);
    } catch (error) {
      console.warn('Failed to decompress data:', error);
      return data;
    }
  }

  // Auto-persist setup
  static setupAutoPersist(queryClient: QueryClient, interval: number = 30000): () => void {
    // Persist on page unload
    const handleBeforeUnload = () => {
      this.persistCache(queryClient);
    };

    // Persist periodically
    const persistInterval = setInterval(() => {
      this.persistCache(queryClient);
    }, interval);

    // Persist on visibility change (when tab becomes hidden)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        this.persistCache(queryClient);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(persistInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }

  // Selective cache restoration
  static restoreSelectiveCache(
    queryClient: QueryClient, 
    queryKeyPatterns: string[]
  ): void {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (!stored) {
        return;
      }

      const serialized = this.config.compress 
        ? this.decompressData(stored)
        : stored;

      const cacheData = JSON.parse(serialized);

      if (cacheData.version !== this.config.version) {
        return;
      }

      const queryCache = queryClient.getQueryCache();
      let restoredCount = 0;

      cacheData.entries.forEach((entry: PersistedCacheEntry) => {
        const keyString = JSON.stringify(entry.queryKey);
        const shouldRestore = queryKeyPatterns.some(pattern => 
          keyString.includes(pattern)
        );

        if (shouldRestore) {
          try {
            queryCache.build(queryClient, {
              queryKey: entry.queryKey,
              queryFn: () => Promise.resolve(entry.data),
            }).setData(entry.data, {
              updatedAt: entry.dataUpdatedAt,
            });

            restoredCount++;
          } catch (error) {
            console.warn('Failed to restore selective cache entry:', entry.queryKey, error);
          }
        }
      });

      console.log(`Selectively restored ${restoredCount} cache entries`);
    } catch (error) {
      console.error('Failed to restore selective cache:', error);
    }
  }

  // Cache migration for version updates
  static migrateCache(
    queryClient: QueryClient,
    migrationFn: (oldData: any) => any
  ): void {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (!stored) {
        return;
      }

      const serialized = this.config.compress 
        ? this.decompressData(stored)
        : stored;

      const cacheData = JSON.parse(serialized);

      // Apply migration to each entry
      const migratedEntries = cacheData.entries.map((entry: PersistedCacheEntry) => {
        try {
          return {
            ...entry,
            data: migrationFn(entry.data),
            version: this.config.version,
          };
        } catch (error) {
          console.warn('Failed to migrate cache entry:', entry.queryKey, error);
          return null;
        }
      }).filter(Boolean);

      // Save migrated cache
      const migratedCacheData = {
        entries: migratedEntries,
        timestamp: Date.now(),
        version: this.config.version,
      };

      const migratedSerialized = this.config.compress 
        ? this.compressData(JSON.stringify(migratedCacheData))
        : JSON.stringify(migratedCacheData);

      localStorage.setItem(this.CACHE_KEY, migratedSerialized);

      console.log(`Migrated ${migratedEntries.length} cache entries`);
    } catch (error) {
      console.error('Failed to migrate cache:', error);
      // Clear corrupted cache
      localStorage.removeItem(this.CACHE_KEY);
    }
  }
}

// Hook for cache persistence
export const useCachePersistence = (queryClient: QueryClient) => {
  const [isRestored, setIsRestored] = React.useState(false);
  const [persistenceStats, setPersistenceStats] = React.useState({
    size: 0,
    entryCount: 0,
  });

  React.useEffect(() => {
    // Restore cache on mount
    CachePersistence.restoreCache(queryClient);
    setIsRestored(true);

    // Set up auto-persist
    const cleanup = CachePersistence.setupAutoPersist(queryClient);

    // Update stats
    const updateStats = () => {
      setPersistenceStats(CachePersistence.getPersistedCacheSize());
    };

    updateStats();
    const statsInterval = setInterval(updateStats, 10000); // Every 10 seconds

    return () => {
      cleanup();
      clearInterval(statsInterval);
    };
  }, [queryClient]);

  const persistCache = React.useCallback(() => {
    CachePersistence.persistCache(queryClient);
  }, [queryClient]);

  const clearPersistedCache = React.useCallback(() => {
    CachePersistence.clearPersistedCache();
    setPersistenceStats({ size: 0, entryCount: 0 });
  }, []);

  const setConfig = React.useCallback((config: Partial<PersistenceConfig>) => {
    CachePersistence.setConfig(config);
  }, []);

  return {
    isRestored,
    persistenceStats,
    persistCache,
    clearPersistedCache,
    setConfig,
  };
};

// Export React import for the hook
import React from 'react';