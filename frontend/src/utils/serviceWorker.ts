/**
 * Service Worker Registration
 * Handles service worker lifecycle and updates
 */

import { Workbox } from 'workbox-window';

class ServiceWorkerManager {
  private workbox: Workbox | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
  }

  public async register(): Promise<void> {
    if (!this.isSupported) {
      console.log('Service Worker not supported');
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      try {
        this.workbox = new Workbox('/sw.js');
        
        // Handle service worker updates
        this.workbox.addEventListener('waiting', () => {
          this.showUpdateNotification();
        });

        // Handle service worker activation
        this.workbox.addEventListener('controlling', () => {
          window.location.reload();
        });

        // Register the service worker
        await this.workbox.register();
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private showUpdateNotification(): void {
    if (confirm('A new version of the app is available. Would you like to update?')) {
      this.workbox?.messageSkipWaiting();
    }
  }

  public async unregister(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
        console.log('Service Workers unregistered');
      } catch (error) {
        console.error('Service Worker unregistration failed:', error);
      }
    }
  }

  public async checkForUpdates(): Promise<void> {
    if (this.workbox) {
      await this.workbox.update();
    }
  }
}

// Create singleton instance
const serviceWorkerManager = new ServiceWorkerManager();

export default serviceWorkerManager;
