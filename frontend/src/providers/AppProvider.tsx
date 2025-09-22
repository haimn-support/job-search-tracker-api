import React from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';
import { CacheProvider } from './CacheProvider';
import { ThemeProvider } from '../contexts/ThemeContext';
import { OfflineIndicator } from '../components/ui';
import { PerformanceMonitor } from '../components/analytics/PerformanceMonitor';
import { AccessibilityTester } from '../components/dev/AccessibilityTester';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <QueryProvider>
        <CacheProvider>
          <AuthProvider>
            {children}
            {/* Performance monitoring */}
            <PerformanceMonitor />
            {/* Accessibility testing (development only) */}
            <AccessibilityTester />
            {/* Global offline indicator */}
            <OfflineIndicator />
            {/* Global toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </CacheProvider>
      </QueryProvider>
    </ThemeProvider>
  );
};

export default AppProvider;