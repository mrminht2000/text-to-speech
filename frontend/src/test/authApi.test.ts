import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authApi, setAuthToken, getAuthToken } from '../services/authApi';

describe('authApi and token storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('sets and gets auth token in localStorage', () => {
    expect(getAuthToken()).toBeNull();

    setAuthToken('test-jwt-token-xyz');
    expect(getAuthToken()).toBe('test-jwt-token-xyz');

    setAuthToken(null);
    expect(getAuthToken()).toBeNull();
  });

  it('register saves token on success', async () => {
    const mockAuthResponse = {
      token: 'jwt-registered-123',
      user: {
        id: 'u1',
        email: 'test@minhtts.dev',
        fullName: 'Test User',
        role: 'user',
        tier: 'free',
        dailyTokensUsed: 0,
        dailyTokenLimit: 2000,
        maxWordsPerRequest: 100,
        remainingTokensToday: 2000,
        createdAt: new Date().toISOString()
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAuthResponse)
    } as any);

    const res = await authApi.register('test@minhtts.dev', 'pass123', 'Test User');
    expect(res.token).toBe('jwt-registered-123');
    expect(getAuthToken()).toBe('jwt-registered-123');
    expect(res.user.tier).toBe('free');
  });

  it('login throws error on bad credentials', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Email hoặc mật khẩu không chính xác' })
    } as any);

    await expect(authApi.login('wrong@minhtts.dev', 'wrongpass')).rejects.toThrow(
      'Email hoặc mật khẩu không chính xác'
    );
  });
});
