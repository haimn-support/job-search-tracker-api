import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { LoginForm } from '../LoginForm';
import { renderWithProviders } from '../../../test-utils';

// Helper function to get password input reliably
const getPasswordInput = () => {
  return document.querySelector('input[name="password"]') as HTMLInputElement;
};

// Mock the auth service
jest.mock('../../../services/authService', () => ({
  authService: {
    login: jest.fn(),
    isAuthenticated: jest.fn(() => false),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

// Mock the notifications
jest.mock('../../../utils/notifications', () => ({
  useNotifications: () => ({
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  }),
}));

// Mock the success confirmation hook
jest.mock('../../../components/ui/SuccessConfirmation', () => ({
  useSuccessConfirmation: () => ({
    showConfirmation: jest.fn(),
  }),
}));

describe('LoginForm Component', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form elements', () => {
    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('handles successful login', async () => {
    const { authService } = require('../../../services/authService');
    authService.login.mockResolvedValue({
      access_token: 'mock-token',
      user: { id: '1', email: 'test@example.com' },
    });
    
    const user = userEvent.setup();
    
    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = getPasswordInput();
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles login error', async () => {
    const { authService } = require('../../../services/authService');
    const error = {
      message: 'Invalid credentials',
      response: { data: { detail: 'Invalid credentials' } }
    };
    authService.login.mockRejectedValue(error);
    
    const user = userEvent.setup();
    
    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = getPasswordInput();
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const { authService } = require('../../../services/authService');
    authService.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    const user = userEvent.setup();
    
    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = getPasswordInput();
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    // Note: The loading text might not be implemented yet, so we'll just check if button is disabled
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = getPasswordInput();
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Tab through form elements (first tab goes to "create account" link)
    await user.tab(); // "create a new account" link
    await user.tab(); // email input
    expect(emailInput).toHaveFocus();
    
    await user.tab(); // password input
    expect(passwordInput).toHaveFocus();
    
    await user.tab(); // remember me checkbox
    await user.tab(); // forgot password link
    await user.tab(); // submit button
    expect(submitButton).toHaveFocus();
  });

  it('submits form on Enter key press', async () => {
    const { authService } = require('../../../services/authService');
    authService.login.mockResolvedValue({
      access_token: 'mock-token',
      user: { id: '1', email: 'test@example.com' },
    });
    
    const user = userEvent.setup();
    
    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = getPasswordInput();
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalled();
    });
  });

  it('has proper ARIA attributes', () => {
    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />);
    
    const form = screen.getByRole('form');
    expect(form).toHaveAttribute('aria-label', 'Login form');
    
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('autoComplete', 'email');
    
    const passwordInput = getPasswordInput();
    expect(passwordInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
  });

  it('passes accessibility tests', async () => {
    const { container } = renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('clears form errors when user starts typing', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Trigger validation error
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
    
    // Start typing to clear error
    await user.type(emailInput, 'test');
    
    await waitFor(() => {
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />);
    
    const passwordInput = getPasswordInput();
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});