import { authService } from '../authService';
import { httpClient } from '../httpClient';
import { createMockUser } from '../../test-utils/test-data';

// Mock the HTTP client
jest.mock('../httpClient');
import { apiRequest } from '../httpClient';
const mockedApiRequest = apiRequest as jest.Mocked<typeof apiRequest>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('successfully logs in user', async () => {
      const mockUser = createMockUser();
      const mockResponse = {
        data: {
          access_token: 'mock-token',
          token_type: 'bearer',
          user: mockUser,
        },
      };

      mockedApiRequest.post.mockResolvedValue(mockResponse.data);

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.login(credentials);

      const formData = new FormData();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      expect(mockedApiRequest.post).toHaveBeenCalledWith('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      expect(result).toEqual(mockResponse.data);
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'mock-token');
    });

    it('handles login error', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Invalid credentials' },
          status: 401,
        },
      };

      mockedApiRequest.post.mockRejectedValue(errorResponse);

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(credentials)).rejects.toEqual(errorResponse);
      // Tokens should not be set when login fails
      expect(localStorage.setItem).not.toHaveBeenCalledWith('access_token', expect.anything());
    });
  });

  describe('logout', () => {
    it('successfully logs out user', async () => {
      localStorage.setItem('access_token', 'mock-token');
      mockedApiRequest.post.mockResolvedValue({});

      await authService.logout();

      expect(mockedApiRequest.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
    });

    it('clears token even if logout request fails', async () => {
      localStorage.setItem('access_token', 'mock-token');
      mockedApiRequest.post.mockRejectedValue(new Error('Network error'));

      await authService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
    });
  });

  describe('getCurrentUser', () => {
    it('successfully gets current user', async () => {
      const mockUser = createMockUser();

      mockedApiRequest.get.mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser();

      expect(mockedApiRequest.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });

    it('handles unauthorized error', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Not authenticated' },
          status: 401,
        },
      };

      mockedApiRequest.get.mockRejectedValue(errorResponse);

      await expect(authService.getCurrentUser()).rejects.toEqual(errorResponse);
    });
  });
});