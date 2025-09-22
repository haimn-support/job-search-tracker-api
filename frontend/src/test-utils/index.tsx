import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../providers/AuthProvider';
import { User } from '../types';

// Mock user for testing
export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

// Create a test query client
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  user?: User | null;
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: ReactElement,
  {
    initialEntries = ['/'],
    user = null,
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider initialUser={user}>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
};

// Render with authenticated user
export const renderWithAuth = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  return renderWithProviders(ui, { ...options, user: mockUser });
};

// Render without authentication
export const renderWithoutAuth = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  return renderWithProviders(ui, { ...options, user: null });
};

// Wait for loading to complete
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

// Mock functions for common use cases
export const mockFunctions = {
  navigate: jest.fn(),
  onSubmit: jest.fn(),
  onCancel: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onClick: jest.fn(),
  onChange: jest.fn(),
};

// Reset all mocks
export const resetMocks = () => {
  Object.values(mockFunctions).forEach(mock => mock.mockReset());
  jest.clearAllMocks();
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';