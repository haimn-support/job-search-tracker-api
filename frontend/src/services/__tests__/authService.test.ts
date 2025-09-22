import { authService } from '../authService';
import { httpClient } from '../httpClient';
import { createMockUser } from '../../test-utils/test-data';

// Mock the HTTP client
jest.mock('../httpClient');
const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

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

      mockedHttpClient.post.mockResolvedValue(mockResponse);

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.login(credentials);

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockResponse.data);
      expect(localStorage.getItem('access_token')).toBe('mock-token');
    });

    it('handles login error', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Invalid credentials' },
          status: 401,
        },
      };

      mockedHttpClient.post.mockRejectedValue(errorResponse);

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(credentials)).rejects.toEqual(errorResponse);
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('logout', () => {
    it('successfully logs out user', async () => {
      localStorage.setItem('access_token', 'mock-token');
      mockedHttpClient.post.mockResolvedValue({ data: {} });

      await authService.logout();

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorage.getItem('access_token')).toBeNull();
    });

    it('clears token even if logout request fails', async () => {
      localStorage.setItem('access_token', 'mock-token');
      mockedHttpClient.post.mockRejectedValue(new Error('Network error'));

      await authService.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('successfully gets current user', async () => {
      const mockUser = createMockUser();
      const mockResponse = { data: mockUser };

      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const result = await authService.getCurrentUser();

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });

    it('handles unauthorized error', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Not authenticated' },
          status: 401,
        },
      };

      mockedHttpClient.get.mockRejectedValue(errorResponse);

      await expect(authService.getCurrentUser()).rejects.toEqual(errorResponse);
    });
  });
});