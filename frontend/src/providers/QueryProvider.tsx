import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient, backgroundSync } from '../lib/queryClient';

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  // Set up background sync when provider mounts
  React.useEffect(() => {
    const cleanup = backgroundSync.start();
    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          toggleButtonProps={{
            style: {
              marginLeft: '5px',
              transform: 'scale(0.8)',
              transformOrigin: 'bottom right',
            },
          }}
        />
      )}
    </QueryClientProvider>
  );
};

export default QueryProvider;