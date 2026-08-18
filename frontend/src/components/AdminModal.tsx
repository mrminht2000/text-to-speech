import React, { useState, useEffect, useCallback } from 'react';
import { AdminUserItem, AdminStats, UserTier } from '../types/auth';
import { authApi } from '../services/authApi';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        authApi.getAdminUsers(1, 50, search, filterTier),
        authApi.getAdminStats()
      ]);
      setUsers(usersRes.items);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, search, filterTier]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!isOpen) return null;

  const handleTierChange = async (userId: string, newTier: UserTier) => {
    setUpdatingUserId(userId);
    try {
      await authApi.updateAdminUserTier(userId, newTier);
      setUsers(users.map(u => u.id === userId ? { ...u, tier: newTier } : u));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật hạng gói');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content admin-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div className="admin-header">
          <div className="admin-badge">🛡️ BẢNG ĐIỀU KHIỂN QUẢN TRỊ</div>
          <h2>Quản trị hệ thống & Người dùng</h2>
          <p className="admin-subtitle">Theo dõi hoạt động tổng thể và cấp quyền hạng gói dịch vụ.</p>
        </div>

        {/* STATS OVERVIEW */}
        {stats && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <span className="stat-label">Tổng người dùng</span>
                <span className="stat-value">{stats.totalUsers.toLocaleString()}</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon">🎙️</div>
              <div className="stat-info">
                <span className="stat-label">Tổng audio đã tạo</span>
                <span className="stat-value">{stats.totalAudiosGenerated.toLocaleString()}</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <span className="stat-label">Audio tạo hôm nay</span>
                <span className="stat-value">{stats.totalAudiosToday.toLocaleString()}</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-info">
                <span className="stat-label">Token tiêu thụ hôm nay</span>
                <span className="stat-value">{stats.totalTokensConsumedToday.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* SEARCH & FILTERS */}
        <div className="admin-filter-bar">
          <input
            type="text"
            className="glass-input search-input"
            placeholder="🔍 Tìm người dùng theo Email, Họ tên..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="glass-select"
            value={filterTier}
            onChange={e => setFilterTier(e.target.value)}
          >
            <option value="">Tất cả gói</option>
            <option value="free">Gói Free</option>
            <option value="basic">Gói Basic</option>
            <option value="pro">Gói Pro</option>
            <option value="ultra">Gói Ultra</option>
          </select>
        </div>

        {/* USERS TABLE */}
        <div className="admin-table-wrapper">
          {loading ? (
            <div className="drawer-empty-state">
              <span className="empty-icon">⏳</span>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="drawer-empty-state">
              <p>Không tìm thấy người dùng nào phù hợp.</p>
            </div>
          ) : (
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Vai trò</th>
                  <th>Hạng gói (Tier)</th>
                  <th>Token dùng hôm nay</th>
                  <th>Audio đã tạo</th>
                  <th>Ngày tham gia</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className="table-avatar">
                          {u.avatarUrl ? <img src={u.avatarUrl} alt="" /> : (u.fullName || u.email)[0].toUpperCase()}
                        </div>
                        <div className="table-user-info">
                          <strong>{u.fullName || 'Chưa đặt tên'}</strong>
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-pill role-${u.role}`}>{u.role}</span>
                    </td>
                    <td>
                      <span className={`tier-badge tier-${u.tier}`}>
                        {u.tier.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {u.dailyTokensUsed.toLocaleString()} / {u.dailyTokenLimit > 100000 ? '∞' : u.dailyTokenLimit.toLocaleString()}
                    </td>
                    <td>{u.totalAudiosGenerated}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <select
                        className="tier-select-action"
                        value={u.tier}
                        disabled={updatingUserId === u.id}
                        onChange={e => handleTierChange(u.id, e.target.value as UserTier)}
                      >
                        <option value="free">🌱 Free</option>
                        <option value="basic">⚡ Basic</option>
                        <option value="pro">⭐ Pro</option>
                        <option value="ultra">👑 Ultra</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
