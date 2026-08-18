import React, { useState, useEffect } from 'react';
import { TierConfig, UserTier } from '../../types/auth';
import { authApi } from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const PricingTiersTab: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const { t, language } = useLanguage();
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getPublicTiers()
      .then(data => setTiers(data))
      .catch(err => console.error('Failed to load tiers:', err))
      .finally(() => setLoading(false));
  }, []);

  const currentTier: UserTier = user?.tier || 'free';

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'ultra': return '👑';
      case 'pro': return '⭐';
      case 'basic': return '⚡';
      case 'free':
      default: return '🌱';
    }
  };

  return (
    <div className="tab-content pricing-tab-layout">
      <div className="card pricing-wide-card">
        <div className="pricing-header">
          <div className="pricing-badge">{t('pricing_title')}</div>
          <h2>{t('pricing_subtitle')}</h2>
        </div>

        <div className="byok-highlight-banner">
          <span className="byok-star">⚡</span>
          <div>
            <strong>{t('byok_tip_title')}</strong> {t('byok_tip_desc')}
          </div>
        </div>

        {loading ? (
          <div className="drawer-empty-state">
            <span className="empty-icon">⏳</span>
            <p>Đang tải thông tin bảng giá...</p>
          </div>
        ) : (
          <div className="pricing-cards-grid">
            {tiers.map(tierConfig => {
              const isCurrent = currentTier === tierConfig.tier.toLowerCase();
              const isPopular = tierConfig.tier.toLowerCase() === 'pro';
              const isUltra = tierConfig.tier.toLowerCase() === 'ultra';
              const isUnlimitedTokens = tierConfig.dailyTokenLimit >= 100000000;
              const desc = language === 'en' ? tierConfig.descriptionEn : tierConfig.descriptionVi;

              return (
                <div 
                  key={tierConfig.tier} 
                  className={`pricing-card ${isCurrent ? 'current-tier' : ''} ${isPopular ? 'popular-card' : ''} ${isUltra ? 'ultra-card' : ''}`}
                >
                  {isPopular && <div className="popular-tag">PHỔ BIẾN NHẤT / POPULAR</div>}
                  {isCurrent && <div className="current-badge">{t('tier_current')}</div>}

                  <div className="tier-header">
                    <div className="tier-icon">{getTierIcon(tierConfig.tier)}</div>
                    <h3 style={{ textTransform: 'capitalize' }}>{tierConfig.tier}</h3>
                    <div className="tier-price">
                      {tierConfig.priceVnd === 0 ? (
                        <>0đ <span>/ mãi mãi</span></>
                      ) : (
                        <>{tierConfig.priceVnd.toLocaleString('vi-VN')}đ <span>/ tháng</span></>
                      )}
                    </div>
                    <p className="tier-desc">{desc || 'Gói dịch vụ AI TTS'}</p>
                  </div>

                  <ul className="tier-features">
                    <li>
                      ✓ <strong>{tierConfig.maxWordsPerRequest.toLocaleString()} {t('words_count')}</strong> / lượt tạo
                    </li>
                    <li>
                      ✓ <strong>{isUnlimitedTokens ? t('tier_unlimited') : `${tierConfig.dailyTokenLimit.toLocaleString()} tokens`}</strong> / ngày
                    </li>
                    <li>✓ 40+ Giọng đọc AI (Gemini, Local GPU, OpenAI, ElevenLabs)</li>
                    <li>✓ Xuất file MP3 & WAV phòng thu</li>
                    <li>✓ Miễn trừ giới hạn token khi dùng BYOK</li>
                  </ul>

                  <button
                    type="button"
                    className={`tier-btn ${isPopular ? 'pro-tier-btn' : isUltra ? 'ultra-tier-btn' : isCurrent ? 'free-btn' : 'primary-tier-btn'}`}
                    disabled={isCurrent}
                    onClick={() => {
                      if (!user) {
                        openAuthModal('register');
                      } else if (!isCurrent) {
                        alert('Vui lòng liên hệ Admin để nâng cấp gói tài khoản trực tiếp!');
                      }
                    }}
                  >
                    {isCurrent ? t('tier_current') : user ? t('tier_upgrade_btn') : 'Đăng ký ngay'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
