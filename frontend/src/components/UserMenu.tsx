import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { UserTier } from '../types/auth';

interface UserMenuProps {
  onNavigateTab: (tab: string) => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onNavigateTab }) => {
  const { user, logout, openAuthModal, linkGoogle, unlinkGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleFeedback, setGoogleFeedback] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTierBadge = (tier: UserTier) => {
    switch (tier) {
      case 'ultra':
        return <span className="tier-badge tier-ultra">ULTRA</span>;
      case 'pro':
        return <span className="tier-badge tier-pro">PRO</span>;
      case 'basic':
        return <span className="tier-badge tier-basic">BASIC</span>;
      case 'free':
      default:
        return <span className="tier-badge tier-free">FREE</span>;
    }
  };

  const handleLinkGoogle = async () => {
    setGoogleLoading(true);
    setGoogleFeedback(null);
    try {
      const mockGoogleSub = `g_oauth_${Math.floor(100000000000000000000 + Math.random() * 900000000000000000000)}`;
      const autoEmail = user?.email || `user.${mockGoogleSub.slice(-6)}@gmail.com`;
      const autoName = user?.fullName || `Google User`;
      const autoAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${autoEmail}`;

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        iss: 'https://accounts.google.com',
        sub: mockGoogleSub,
        email: autoEmail,
        email_verified: true,
        name: autoName,
        picture: autoAvatar,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }));
      const signature = btoa('mock_signature');
      const idToken = `${header}.${payload}.${signature}`;

      await linkGoogle(idToken);
      setGoogleFeedback(t('google_link_success'));
      setTimeout(() => setGoogleFeedback(null), 3000);
    } catch (err: any) {
      setGoogleFeedback(`⚠️ ${err.message || 'Lỗi liên kết'}`);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy liên kết tài khoản Google?')) return;
    setGoogleLoading(true);
    setGoogleFeedback(null);
    try {
      await unlinkGoogle();
      setGoogleFeedback(t('google_unlink_success'));
      setTimeout(() => setGoogleFeedback(null), 3000);
    } catch (err: any) {
      setGoogleFeedback(`⚠️ ${err.message || 'Lỗi hủy liên kết'}`);
    } finally {
      setGoogleLoading(false);
    }
  };

  const renderQuickControls = () => (
    <div className="quick-controls-group">
      {/* Theme Toggle Button */}
      <button 
        type="button" 
        className="icon-control-btn"
        onClick={toggleTheme}
        title={theme === 'dark' ? t('theme_toggle_light') : t('theme_toggle_dark')}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Language Switcher Button */}
      <button 
        type="button" 
        className="lang-control-btn"
        onClick={toggleLanguage}
        title={t('lang_toggle')}
      >
        {language === 'vi' ? 'VI' : 'EN'}
      </button>
    </div>
  );

  if (!user) {
    return (
      <div className="user-menu-guest">
        {renderQuickControls()}
        <button 
          type="button" 
          className="pricing-nav-btn"
          onClick={() => onNavigateTab('pricing')}
        >
          {t('tab_pricing')}
        </button>
        <button 
          type="button" 
          className="login-nav-btn"
          onClick={() => openAuthModal('login')}
        >
          {t('login_btn')}
        </button>
      </div>
    );
  }

  const isUnlimited = user.dailyTokenLimit >= 100000000;
  const percentUsed = isUnlimited ? 0 : Math.min(100, Math.round((user.dailyTokensUsed / user.dailyTokenLimit) * 100));

  return (
    <div className="user-menu-container" ref={menuRef}>
      {renderQuickControls()}

      <button 
        type="button" 
        className="user-profile-trigger"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <div className="user-avatar">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} />
          ) : (
            <span>{(user.fullName || user.email)[0].toUpperCase()}</span>
          )}
        </div>
        <div className="user-summary">
          <div className="user-name-row">
            <span className="user-name">{user.fullName || user.email.split('@')[0]}</span>
            {getTierBadge(user.tier)}
          </div>
          <div className="user-token-mini">
            {isUnlimited ? (
              <span>Token: Không giới hạn</span>
            ) : (
              <span>{user.dailyTokensUsed.toLocaleString()} / {user.dailyTokenLimit.toLocaleString()} token</span>
            )}
          </div>
        </div>
        <span className="dropdown-caret">{dropdownOpen ? '▲' : '▼'}</span>
      </button>

      {dropdownOpen && (
        <div className="user-dropdown-menu">
          <div className="dropdown-header">
            <div className="dropdown-email">{user.email}</div>
            <div className="token-progress-container">
              <div className="token-progress-labels">
                <span>{t('token_today_label')}</span>
                <span>{isUnlimited ? '∞' : `${percentUsed}%`}</span>
              </div>
              <div className="token-progress-bar">
                <div 
                  className="token-progress-fill" 
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>
          </div>

          {/* Google Link Status Section */}
          <div className="google-link-section">
            <div className="google-link-status">
              <span className="google-icon-mini">🌐</span>
              <span className="google-link-text">
                {user.isGoogleLinked ? t('google_linked') : t('google_not_linked')}
              </span>
            </div>
            {user.isGoogleLinked ? (
              <button
                type="button"
                className="google-action-link-btn unlink-btn"
                disabled={googleLoading}
                onClick={handleUnlinkGoogle}
              >
                {googleLoading ? '...' : t('btn_unlink_google')}
              </button>
            ) : (
              <button
                type="button"
                className="google-action-link-btn link-btn"
                disabled={googleLoading}
                onClick={handleLinkGoogle}
              >
                {googleLoading ? '...' : t('btn_link_google')}
              </button>
            )}
          </div>

          {googleFeedback && (
            <div className="google-link-feedback">
              {googleFeedback}
            </div>
          )}

          <div className="dropdown-divider" />

          <button 
            type="button" 
            className="dropdown-item"
            onClick={() => { setDropdownOpen(false); onNavigateTab('library'); }}
          >
            {t('tab_library')}
          </button>

          <button 
            type="button" 
            className="dropdown-item"
            onClick={() => { setDropdownOpen(false); onNavigateTab('api_keys'); }}
          >
            {t('tab_api_keys')}
          </button>

          <button 
            type="button" 
            className="dropdown-item"
            onClick={() => { setDropdownOpen(false); onNavigateTab('pricing'); }}
          >
            {t('tab_pricing')}
          </button>

          {user.role === 'admin' && (
            <button 
              type="button" 
              className="dropdown-item admin-item"
              onClick={() => { setDropdownOpen(false); onNavigateTab('admin'); }}
            >
              {t('tab_admin')}
            </button>
          )}

          <div className="dropdown-divider" />

          <button 
            type="button" 
            className="dropdown-item logout-item"
            onClick={() => { setDropdownOpen(false); logout(); }}
          >
            {t('logout_btn')}
          </button>
        </div>
      )}
    </div>
  );
};
