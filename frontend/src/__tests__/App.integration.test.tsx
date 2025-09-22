import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import { AuthProvider } from '../providers/AuthProvider';

// Mock services
jest.mock('../services/authService', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

jest.mock('../services/positionService', () => ({
  positionService: {
    getPositions: jest.fn(),
    getPosition: jest.fn(),
    createPosition: jest.fn(),
    updatePosition: jest.fn(),
    deletePosition: jest.fn(),
  },
}));

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
};

const renderApp = (initialUser = null) => {
  const queryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialUser={initialUser}>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows login page for unauthenticated users', async () => {
    const { authService } = require('../services/authService');
    authService.getCurrentUser.mockRejectedValue({ response: { status: 401 } });

    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });
  });

  it('shows dashboard for authenticated users', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    };

    const { authService } = require('../services/authService');
    const { positionService } = require('../services/positionService');
    
    authService.getCurrentUser.mockResolvedValue(mockUser);
    positionService.getPositions.mockResolvedValue({
      positions: [],
      total: 0,
    });

    renderApp(mockUser);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/welcome back, test/i)).toBeInTheDocument();
    });
  });

  it('handles login flow', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    };

    const { authService } = require('../services/authService');
    const { positionService } = require('../services/positionService');
    
    authService.getCurrentUser.mockRejectedValue({ response: { status: 401 } });
    authService.login.mockResolvedValue({
      access_token: 'mock-token',
      user: mockUser,
    });
    positionService.getPositions.mockResolvedValue({
      positions: [],
      total: 0,
    });

    const user = userEvent.setup();
    renderApp();

    // Wait for login page to load
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    // Fill in login form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('handles logout flow', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    };

    const { authService } = require('../services/authService');
    const { positionService } = require('../services/positionService');
    
    authService.getCurrentUser.mockResolvedValue(mockUser);
    authService.logout.mockResolvedValue({});
    positionService.getPositions.mockResolvedValue({
      positions: [],
      total: 0,
    });

    const user = userEvent.setup();
    renderApp(mockUser);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    // Click user menu and logout
    const userMenuButton = screen.getByRole('button', { name: /user menu/i });
    await user.click(userMenuButton);

    const logoutButton = screen.getByRole('button', { name: /sign out/i });
    await user.click(logoutButton);

    // Wait for login page to appear
    await waitFor(() => {
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });

    expect(authService.logout).toHaveBeenCalled();
  });
});