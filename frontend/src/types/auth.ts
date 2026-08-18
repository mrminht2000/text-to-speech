export type UserTier = 'free' | 'basic' | 'pro' | 'ultra';
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  isGoogleLinked: boolean;
  role: UserRole;
  tier: UserTier;
  dailyTokensUsed: number;
  dailyTokenLimit: number;
  maxWordsPerRequest: number;
  remainingTokensToday: number;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AudioHistoryItem {
  id: string;
  text: string;
  model: string;
  voice: string;
  speed: number;
  contentType: string;
  fileSizeBytes: number;
  durationSeconds: number;
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  isByok: boolean;
  downloadUrl: string;
  createdAt: string;
}

export interface HistoryListResponse {
  items: AudioHistoryItem[];
  totalCount: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
  tier: UserTier;
  dailyTokensUsed: number;
  dailyTokenLimit: number;
  totalAudiosGenerated: number;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalAudiosGenerated: number;
  totalAudiosToday: number;
  totalTokensConsumedToday: number;
  usersByTier: Record<string, number>;
}

export interface TierConfig {
  tier: UserTier;
  maxWordsPerRequest: number;
  dailyTokenLimit: number;
  priceVnd: number;
  descriptionVi: string;
  descriptionEn: string;
  updatedAt: string;
}

export interface UpdateTierLimitsRequest {
  maxWordsPerRequest: number;
  dailyTokenLimit: number;
  priceVnd: number;
  descriptionVi?: string;
  descriptionEn?: string;
}
