import { CacheManager } from './cacheManager';

// Offline queue item interface
export interface OfflineQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: 'position' | 'interview';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  url: string;
  method: string;
  headers?: Record<string, string>;
}

// Offline queue manager
export class OfflineQueue {
  private static readonly QUEUE_KEY = 'offline_queue';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second base delay
  private static isProcessing = false;
  private static listeners: Array<(queue: OfflineQueueItem[]) => void> = [];

  // Add item to offline queue
  static addToQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>): void {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES,
    };

    const queue = this.getQueue();
    queue.push(queueItem);
    this.saveQueue(queue);
    this.notifyListeners(queue);

    console.log('Added to offline queue:', queueItem);
  }

  // Get current queue
  static getQueue(): OfflineQueueItem[] {
    try {
      const stored = localStorage.getItem(this.QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load offline queue:', error);
      return [];
    }
  }

  // Save queue to localStorage
  private static saveQueue(queue: OfflineQueueItem[]): void {
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.warn('Failed to save offline queue:', error);
    }
  }

  // Remove item from queue
  static removeFromQueue(id: string): void {
    const queue = this.getQueue().filter(item => item.id !== id);
    this.saveQueue(queue);
    this.notifyListeners(queue);
  }

  // Update retry count for item
  private static updateRetryCount(id: string): void {
    const queue = this.getQueue();
    const item = queue.find(item => item.id === id);
    if (item) {
      item.retryCount++;
      this.saveQueue(queue);
      this.notifyListeners(queue);
    }
  }

  // Process offline queue
  static async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;
    const queue = this.getQueue();

    console.log(`Processing offline queue with ${queue.length} items`);

    for (const item of queue) {
      try {
        await this.processQueueItem(item);
        this.removeFromQueue(item.id);
        console.log('Successfully processed offline queue item:', item.id);
      } catch (error) {
        console.error('Failed to process offline queue item:', item.id, error);
        
        if (item.retryCount < item.maxRetries) {
          this.updateRetryCount(item.id);
          // Exponential backoff delay
          const delay = this.RETRY_DELAY * Math.pow(2, item.retryCount);
          setTimeout(() => {
            // Will be processed in next queue processing cycle
          }, delay);
        } else {
          // Max retries reached, remove from queue
          console.error('Max retries reached for offline queue item:', item.id);
          this.removeFromQueue(item.id);
        }
      }
    }

    this.isProcessing = false;
  }

  // Process individual queue item
  private static async processQueueItem(item: OfflineQueueItem): Promise<void> {
    const response = await fetch(item.url, {
      method: item.method,
      headers: {
        'Content-Type': 'application/json',
        ...item.headers,
      },
      body: item.data ? JSON.stringify(item.data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Clear entire queue
  static clearQueue(): void {
    localStorage.removeItem(this.QUEUE_KEY);
    this.notifyListeners([]);
  }

  // Get queue size
  static getQueueSize(): number {
    return this.getQueue().length;
  }

  // Check if queue has items
  static hasItems(): boolean {
    return this.getQueueSize() > 0;
  }

  // Add listener for queue changes
  static addListener(listener: (queue: OfflineQueueItem[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of queue changes
  private static notifyListeners(queue: OfflineQueueItem[]): void {
    this.listeners.forEach(listener => {
      try {
        listener(queue);
      } catch (error) {
        console.error('Error in offline queue listener:', error);
      }
    });
  }

  // Initialize offline queue
  static initialize(): void {
    // Process queue when coming back online
    window.addEventListener('online', () => {
      console.log('Network connection restored, processing offline queue');
      this.processQueue();
    });

    // Process queue on page load if online
    if (navigator.onLine) {
      setTimeout(() => this.processQueue(), 1000);
    }

    // Periodic queue processing (in case of missed online events)
    setInterval(() => {
      if (navigator.onLine && this.hasItems()) {
        this.processQueue();
      }
    }, 30000); // Every 30 seconds
  }

  // Get queue statistics
  static getStatistics(): {
    totalItems: number;
    itemsByType: Record<string, number>;
    itemsByResource: Record<string, number>;
    oldestItem?: Date;
    newestItem?: Date;
  } {
    const queue = this.getQueue();
    
    const itemsByType = queue.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const itemsByResource = queue.reduce((acc, item) => {
      acc[item.resource] = (acc[item.resource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const timestamps = queue.map(item => item.timestamp);
    const oldestItem = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : undefined;
    const newestItem = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined;

    return {
      totalItems: queue.length,
      itemsByType,
      itemsByResource,
      oldestItem,
      newestItem,
    };
  }
}

// Hook for using offline queue
export const useOfflineQueue = () => {
  const [queue, setQueue] = React.useState<OfflineQueueItem[]>(OfflineQueue.getQueue());
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for queue changes
    const unsubscribe = OfflineQueue.addListener(setQueue);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const addToQueue = React.useCallback((item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>) => {
    OfflineQueue.addToQueue(item);
  }, []);

  const processQueue = React.useCallback(() => {
    OfflineQueue.processQueue();
  }, []);

  const clearQueue = React.useCallback(() => {
    OfflineQueue.clearQueue();
  }, []);

  const getStatistics = React.useCallback(() => {
    return OfflineQueue.getStatistics();
  }, []);

  return {
    queue,
    isOnline,
    addToQueue,
    processQueue,
    clearQueue,
    getStatistics,
    hasItems: queue.length > 0,
  };
};

// Initialize offline queue when module loads
if (typeof window !== 'undefined') {
  OfflineQueue.initialize();
}

// Export React import for the hook
import React from 'react';