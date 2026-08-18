import React, { useState, useEffect, useCallback } from 'react';
import { AdminUserItem, AdminStats, TierConfig, UserTier } from '../../types/auth';
import { authApi } from '../../services/authApi';
import { useLanguage } from '../../context/LanguageContext';

export const AdminDashboardTab: React.FC = () => {
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'tiers'>('users');

  // Users & Stats state
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Tier Configs state
  const [tierConfigs, setTierConfigs] = useState<TierConfig[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [savingTier, setSavingTier] = useState<string | null>(null);
  const [tierFeedback, setTierFeedback] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        authApi.getAdminUsers(1, 50, search, filterTier),
        authApi.getAdminStats()
      ]);
      setUsers(usersRes.items);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load admin user data:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [search, filterTier]);

  const loadTierConfigs = useCallback(async () => {
    setLoadingTiers(true);
    try {
      const data = await authApi.getAdminTiers();
      setTierConfigs(data);
    } catch (err) {
      console.error('Failed to load tier configs:', err);
    } finally {
      setLoadingTiers(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadTierConfigs();
  }, [loadUserData, loadTierConfigs]);

  const handleUserTierChange = async (userId: string, newTier: UserTier) => {
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

  const handleTierConfigChange = (tier: string, field: keyof TierConfig, val: any) => {
    setTierConfigs(tierConfigs.map(c => {
      if (c.tier.toLowerCase() === tier.toLowerCase()) {
        return { ...c, [field]: val };
      }
      return c;
    }));
  };

  const handleSaveTierConfig = async (tierConfig: TierConfig) => {
    setSavingTier(tierConfig.tier);
    setTierFeedback(null);
    try {
      await authApi.updateAdminTierLimits(tierConfig.tier, {
        maxWordsPerRequest: Number(tierConfig.maxWordsPerRequest),
        dailyTokenLimit: Number(tierConfig.dailyTokenLimit),
        priceVnd: Number(tierConfig.priceVnd),
        descriptionVi: tierConfig.descriptionVi,
        descriptionEn: tierConfig.descriptionEn
      });
      setTierFeedback(`✓ Đã lưu thành công cấu hình cho gói ${tierConfig.tier.toUpperCase()}!`);
      setTimeout(() => setTierFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu cấu hình gói');
    } finally {
      setSavingTier(null);
    }
  };

  return (
    <div className="tab-content admin-tab-layout">
      <div className="card admin-main-card">
        <div className="admin-header-row">
          <div>
            <h2>{t('admin_title')}</h2>
            <p className="admin-subtitle">{t('admin_subtitle')}</p>
          </div>

          <div className="admin-subtabs">
            <button
              type="button"
              className={`admin-subtab-btn ${activeSubTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('users')}
            >
              {t('admin_tab_stats')}
            </button>
            <button
              type="button"
              className={`admin-subtab-btn ${activeSubTab === 'tiers' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('tiers')}
            >
              {t('admin_tab_tier_limits')}
            </button>
          </div>
        </div>

        {tierFeedback && (
          <div className="save-success-banner" style={{ marginBottom: '16px' }}>
            {tierFeedback}
          </div>
        )}

        {/* SUBTAB 1: USERS & STATS */}
        {activeSubTab === 'users' && (
          <div className="admin-subtab-content">
            {/* STATS OVERVIEW */}
            {stats && (
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <span className="stat-label">{t('stat_total_users')}</span>
                    <span className="stat-value">{stats.totalUsers.toLocaleString()}</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-icon">🎙️</div>
                  <div className="stat-info">
                    <span className="stat-label">{t('stat_total_audios')}</span>
                    <span className="stat-value">{stats.totalAudiosGenerated.toLocaleString()}</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-info">
                    <span className="stat-label">{t('stat_today_audios')}</span>
                    <span className="stat-value">{stats.totalAudiosToday.toLocaleString()}</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-icon">⚡</div>
                  <div className="stat-info">
                    <span className="stat-label">{t('stat_today_tokens')}</span>
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
                placeholder="Tìm theo Email hoặc Tên người dùng..."
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
              {loadingUsers ? (
                <div className="drawer-empty-state">
                  <span className="empty-icon">⏳</span>
                  <p>Đang tải danh sách người dùng...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="drawer-empty-state">
                  <p>Không tìm thấy người dùng nào.</p>
                </div>
              ) : (
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th>{t('col_user')}</th>
                      <th>{t('col_role')}</th>
                      <th>{t('col_tier')}</th>
                      <th>{t('col_tokens_today')}</th>
                      <th>{t('col_audios_count')}</th>
                      <th>{t('col_joined_date')}</th>
                      <th>{t('col_actions')}</th>
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
                            onChange={e => handleUserTierChange(u.id, e.target.value as UserTier)}
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
        )}

        {/* SUBTAB 2: TIER LIMITS CONFIGURATION */}
        {activeSubTab === 'tiers' && (
          <div className="admin-subtab-content">
            <div className="tier-editor-banner">
              <strong>💡 Hướng dẫn cấu hình:</strong> Thay đổi giới hạn số từ tối đa một lượt tạo và hạn mức token hàng ngày cho từng gói. Nhấn <strong>"Lưu Cấu Hình"</strong> để áp dụng ngay lập tức cho toàn hệ thống.
            </div>

            {loadingTiers ? (
              <div className="drawer-empty-state">
                <span className="empty-icon">⏳</span>
                <p>Đang tải cấu hình các gói...</p>
              </div>
            ) : (
              <div className="tier-editor-grid">
                {tierConfigs.map(cfg => {
                  const isSaving = savingTier === cfg.tier;
                  return (
                    <div key={cfg.tier} className="tier-edit-card">
                      <div className="tier-edit-header">
                        <span className={`tier-badge tier-${cfg.tier.toLowerCase()}`}>
                          {cfg.tier.toUpperCase()}
                        </span>
                        <span className="tier-updated-date">
                          Cập nhật: {new Date(cfg.updatedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <div className="tier-edit-form">
                        <div className="edit-form-field">
                          <label>Tối đa từ / lượt tạo (Max Words):</label>
                          <input
                            type="number"
                            className="glass-input"
                            min="10"
                            max="100000"
                            value={cfg.maxWordsPerRequest}
                            onChange={e => handleTierConfigChange(cfg.tier, 'maxWordsPerRequest', parseInt(e.target.value, 10) || 0)}
                          />
                        </div>

                        <div className="edit-form-field">
                          <label>Hạn mức Token / ngày (Daily Tokens):</label>
                          <input
                            type="number"
                            className="glass-input"
                            min="100"
                            value={cfg.dailyTokenLimit}
                            onChange={e => handleTierConfigChange(cfg.tier, 'dailyTokenLimit', parseInt(e.target.value, 10) || 0)}
                          />
                          <span className="field-hint">Nhập 100,000,000 để đại diện cho Không giới hạn (∞)</span>
                        </div>

                        <div className="edit-form-field">
                          <label>Giá gói (VNĐ / tháng):</label>
                          <input
                            type="number"
                            className="glass-input"
                            min="0"
                            step="1000"
                            value={cfg.priceVnd}
                            onChange={e => handleTierConfigChange(cfg.tier, 'priceVnd', parseInt(e.target.value, 10) || 0)}
                          />
                        </div>

                        <div className="edit-form-field">
                          <label>Mô tả Tiếng Việt:</label>
                          <input
                            type="text"
                            className="glass-input"
                            value={cfg.descriptionVi}
                            onChange={e => handleTierConfigChange(cfg.tier, 'descriptionVi', e.target.value)}
                          />
                        </div>

                        <div className="edit-form-field">
                          <label>Mô tả Tiếng Anh:</label>
                          <input
                            type="text"
                            className="glass-input"
                            value={cfg.descriptionEn}
                            onChange={e => handleTierConfigChange(cfg.tier, 'descriptionEn', e.target.value)}
                          />
                        </div>

                        <button
                          type="button"
                          className="btn-save-key"
                          style={{ width: '100%', marginTop: '8px' }}
                          disabled={isSaving}
                          onClick={() => handleSaveTierConfig(cfg)}
                        >
                          {isSaving ? '⏳ Đang lưu...' : t('btn_save_tier_config')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
