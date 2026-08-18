import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserTier } from '../types/auth';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const { user, openAuthModal } = useAuth();

  if (!isOpen) return null;

  const currentTier: UserTier = user?.tier || 'free';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content pricing-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div className="pricing-header">
          <div className="pricing-badge">💎 BẢNG GIÁ & HẠNG GÓI DỊCH VỤ</div>
          <h2>Chọn gói phù hợp với nhu cầu của bạn</h2>
          <p className="pricing-subtitle">
            Hệ thống phân bổ token hàng ngày linh hoạt và hỗ trợ không giới hạn cho người dùng mang API Key cá nhân (BYOK).
          </p>
        </div>

        <div className="byok-highlight-banner">
          <span className="byok-star">⚡</span>
          <div>
            <strong>Mẹo tối ưu chi phí:</strong> Sử dụng tùy chọn <strong>"Mang API Key cá nhân (BYOK)"</strong> để tạo giọng đọc <strong>HOÀN TOÀN MIỄN PHÍ</strong> và không bị trừ vào hạn mức token hàng ngày trên mọi gói!
          </div>
        </div>

        <div className="pricing-cards-grid">
          {/* FREE TIER */}
          <div className={`pricing-card ${currentTier === 'free' ? 'current-tier' : ''}`}>
            {currentTier === 'free' && <div className="current-badge">Gói hiện tại</div>}
            <div className="tier-header">
              <div className="tier-icon">🌱</div>
              <h3>Free</h3>
              <div className="tier-price">0đ <span>/ mãi mãi</span></div>
              <p className="tier-desc">Dành cho trải nghiệm và chuyển đổi đoạn văn bản ngắn</p>
            </div>
            <ul className="tier-features">
              <li>✓ <strong>100 từ</strong> / lượt tạo</li>
              <li>✓ <strong>2,000 token</strong> / ngày</li>
              <li>✓ 30+ Giọng đọc AI Gemini & Local</li>
              <li>✓ Xuất file MP3 / WAV chất lượng cao</li>
              <li>✓ Miễn trừ giới hạn khi dùng BYOK</li>
            </ul>
            <button 
              type="button" 
              className="tier-btn free-btn" 
              disabled={currentTier === 'free'}
              onClick={() => !user && openAuthModal('register')}
            >
              {currentTier === 'free' ? 'Đang sử dụng' : 'Gói mặc định'}
            </button>
          </div>

          {/* BASIC TIER */}
          <div className={`pricing-card ${currentTier === 'basic' ? 'current-tier' : ''}`}>
            {currentTier === 'basic' && <div className="current-badge">Gói hiện tại</div>}
            <div className="tier-header">
              <div className="tier-icon">⚡</div>
              <h3>Basic</h3>
              <div className="tier-price">49.000đ <span>/ tháng</span></div>
              <p className="tier-desc">Phù hợp cho người làm video ngắn, podcast và tin tức</p>
            </div>
            <ul className="tier-features">
              <li>✓ <strong>1,000 từ</strong> / lượt tạo</li>
              <li>✓ <strong>10,000 token</strong> / ngày</li>
              <li>✓ Tất cả tính năng của gói Free</li>
              <li>✓ Hỗ trợ Voice Cloning (Nhân bản giọng)</li>
              <li>✓ Tốc độ ưu tiên trên máy chủ</li>
            </ul>
            <button 
              type="button" 
              className="tier-btn primary-tier-btn"
              onClick={() => alert('Vui lòng liên hệ Admin để nâng cấp gói tài khoản trực tiếp!')}
            >
              {currentTier === 'basic' ? 'Đang sử dụng' : 'Nâng cấp Basic'}
            </button>
          </div>

          {/* PRO TIER */}
          <div className={`pricing-card popular-card ${currentTier === 'pro' ? 'current-tier' : ''}`}>
            <div className="popular-tag">PHỔ BIẾN NHẤT</div>
            {currentTier === 'pro' && <div className="current-badge">Gói hiện tại</div>}
            <div className="tier-header">
              <div className="tier-icon">⭐</div>
              <h3>Pro</h3>
              <div className="tier-price">149.000đ <span>/ tháng</span></div>
              <p className="tier-desc">Dành cho Content Creator, đọc sách nói và bài viết dài</p>
            </div>
            <ul className="tier-features">
              <li>✓ <strong>5,000 từ</strong> / lượt tạo</li>
              <li>✓ <strong>30,000 token</strong> / ngày</li>
              <li>✓ Tốc độ tổng hợp âm thanh cực nhanh</li>
              <li>✓ Lưu trữ thư viện âm thanh không giới hạn</li>
              <li>✓ Hỗ trợ kỹ thuật ưu tiên 24/7</li>
            </ul>
            <button 
              type="button" 
              className="tier-btn pro-tier-btn"
              onClick={() => alert('Vui lòng liên hệ Admin để nâng cấp gói tài khoản trực tiếp!')}
            >
              {currentTier === 'pro' ? 'Đang sử dụng' : 'Nâng cấp Pro'}
            </button>
          </div>

          {/* ULTRA TIER */}
          <div className={`pricing-card ultra-card ${currentTier === 'ultra' ? 'current-tier' : ''}`}>
            {currentTier === 'ultra' && <div className="current-badge">Gói hiện tại</div>}
            <div className="tier-header">
              <div className="tier-icon">👑</div>
              <h3>Ultra</h3>
              <div className="tier-price">299.000đ <span>/ tháng</span></div>
              <p className="tier-desc">Toàn quyền không giới hạn cho doanh nghiệp & nhà xuất bản</p>
            </div>
            <ul className="tier-features">
              <li>✓ <strong>Không giới hạn</strong> số từ / lượt</li>
              <li>✓ <strong>Không giới hạn</strong> token / ngày</li>
              <li>✓ Đầy đủ tất cả model Cloud & Local GPU</li>
              <li>✓ Ưu tiên hàng đợi cao nhất trên hệ thống</li>
              <li>✓ Quyền truy cập sớm các model AI mới</li>
            </ul>
            <button 
              type="button" 
              className="tier-btn ultra-tier-btn"
              onClick={() => alert('Vui lòng liên hệ Admin để nâng cấp gói tài khoản trực tiếp!')}
            >
              {currentTier === 'ultra' ? 'Đang sử dụng' : 'Nâng cấp Ultra'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
