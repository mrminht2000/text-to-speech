import { AuthResponse, User, HistoryListResponse, AdminUserItem, AdminStats, TierConfig, UpdateTierLimitsRequest } from '../types/auth';
import { hashClientPassword } from '../utils/crypto';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function getAuthToken(): string | null {
  return localStorage.getItem('minhtts_jwt_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('minhtts_jwt_token', token);
  } else {
    localStorage.removeItem('minhtts_jwt_token');
  }
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const authApi = {
  async register(email: string, rawPassword: string, fullName?: string): Promise<AuthResponse> {
    // Hash password on client-side before sending to network
    const hashedPassword = await hashClientPassword(rawPassword);

    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: hashedPassword, fullName: fullName || '' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Đăng ký thất bại' }));
      throw new Error(err.error || 'Đăng ký không thành công');
    }
    const data: AuthResponse = await res.json();
    setAuthToken(data.token);
    return data;
  },

  async login(email: string, rawPassword: string): Promise<AuthResponse> {
    // Hash password on client-side before sending to network
    const hashedPassword = await hashClientPassword(rawPassword);

    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: hashedPassword })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Đăng nhập thất bại' }));
      throw new Error(err.error || 'Email hoặc mật khẩu không chính xác');
    }
    const data: AuthResponse = await res.json();
    setAuthToken(data.token);
    return data;
  },

  async googleLogin(credential: string, email?: string, fullName?: string, avatarUrl?: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, email, fullName, avatarUrl })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Đăng nhập Google thất bại' }));
      throw new Error(err.error || 'Đăng nhập Google không thành công');
    }
    const data: AuthResponse = await res.json();
    setAuthToken(data.token);
    return data;
  },

  async linkGoogle(credential: string, email?: string, fullName?: string, avatarUrl?: string): Promise<User> {
    const res = await fetch(`${API_BASE}/api/auth/link-google`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ credential, email, fullName, avatarUrl })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Liên kết Google thất bại' }));
      throw new Error(err.error || 'Không thể liên kết tài khoản Google');
    }
    return await res.json();
  },

  async unlinkGoogle(): Promise<User> {
    const res = await fetch(`${API_BASE}/api/auth/unlink-google`, {
      method: 'POST',
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Hủy liên kết thất bại' }));
      throw new Error(err.error || 'Không thể hủy liên kết Google');
    }
    return await res.json();
  },

  async getMe(): Promise<User | null> {
    const token = getAuthToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: authHeaders()
      });
      if (!res.ok) {
        setAuthToken(null);
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  },

  async getHistory(page = 1, pageSize = 20, search?: string, model?: string): Promise<HistoryListResponse> {
    const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
    if (search) params.append('search', search);
    if (model) params.append('model', model);

    const res = await fetch(`${API_BASE}/api/history?${params.toString()}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Không thể tải lịch sử tạo âm thanh');
    return await res.json();
  },

  async deleteHistory(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/history/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Không thể xóa bản ghi');
  },

  async clearHistory(): Promise<void> {
    const res = await fetch(`${API_BASE}/api/history/clear`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Không thể xóa toàn bộ lịch sử');
  },

  async getPublicTiers(): Promise<TierConfig[]> {
    const res = await fetch(`${API_BASE}/api/tiers`);
    if (!res.ok) throw new Error('Không thể tải danh sách gói');
    return await res.json();
  },

  async getAdminUsers(page = 1, pageSize = 20, search?: string, tier?: string): Promise<{ items: AdminUserItem[]; totalCount: number }> {
    const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
    if (search) params.append('search', search);
    if (tier) params.append('tier', tier);

    const res = await fetch(`${API_BASE}/api/admin/users?${params.toString()}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Không thể tải danh sách người dùng');
    return await res.json();
  },

  async updateAdminUserTier(userId: string, tier: string): Promise<User> {
    const res = await fetch(`${API_BASE}/api/admin/users/${userId}/tier`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ tier })
    });
    if (!res.ok) throw new Error('Không thể cập nhật hạng gói');
    return await res.json();
  },

  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_BASE}/api/admin/stats`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Không thể tải thống kê hệ thống');
    return await res.json();
  },

  async getAdminTiers(): Promise<TierConfig[]> {
    const res = await fetch(`${API_BASE}/api/admin/tiers`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Không thể tải cấu hình hạng gói');
    return await res.json();
  },

  async updateAdminTierLimits(tier: string, req: UpdateTierLimitsRequest): Promise<TierConfig> {
    const res = await fetch(`${API_BASE}/api/admin/tiers/${tier}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error('Không thể lưu cấu hình hạn mức');
    return await res.json();
  }
};
