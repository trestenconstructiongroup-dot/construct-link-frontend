/**
 * @jest-environment node
 */

/**
 * Tests for the api.ts service module.
 *
 * We test:
 * 1. buildAuthHeader logic (Django token vs Supabase JWT detection)
 * 2. apiFetch error parsing (JSON vs plain text)
 * 3. apiFetch network error handling
 */

// We need to set the env var before importing the module
process.env.EXPO_PUBLIC_BACKEND_API_BASE = 'https://test-api.example.com';

// Mock global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// Provide __DEV__ for the module
(global as any).__DEV__ = true;

// Use require so we can control env before import
let api: typeof import('../../services/api');

beforeAll(() => {
  api = require('../../services/api');
});

afterEach(() => {
  mockFetch.mockReset();
});

describe('api service', () => {
  describe('healthCheck', () => {
    it('calls the health endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ status: 'ok' }),
      });

      const result = await api.healthCheck();
      expect(result).toEqual({ status: 'ok' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.example.com/api/health/',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });
  });

  describe('login', () => {
    it('sends email and password to /api/login/', async () => {
      const mockResponse = {
        token: 'abc123',
        user: { id: 1, email: 'test@example.com' },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      });

      const result = await api.login({ email: 'test@example.com', password: 'pass123' });
      expect(result).toEqual(mockResponse);

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe('https://test-api.example.com/api/login/');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({
        email: 'test@example.com',
        password: 'pass123',
      });
    });
  });

  describe('error handling', () => {
    it('parses JSON error responses and throws', async () => {
      const errorBody = { detail: 'Invalid credentials' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify(errorBody),
      });

      await expect(api.healthCheck()).rejects.toThrow();
    });

    it('handles non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(api.healthCheck()).rejects.toThrow('Internal Server Error');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(api.healthCheck()).rejects.toThrow(
        'Network error: Could not connect to the server'
      );
    });
  });

  describe('authenticated requests', () => {
    it('attaches Token header for Django-style tokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ id: 1 }),
      });

      await api.getUserProfile('abc123djangotoken');

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.headers.Authorization).toBe('Token abc123djangotoken');
    });

    it('attaches Bearer header for JWT tokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ id: 1 }),
      });

      // JWT format: three dot-separated base64 segments
      const jwtToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123';
      await api.getUserProfile(jwtToken);

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.headers.Authorization).toBe(`Bearer ${jwtToken}`);
    });
  });
});
