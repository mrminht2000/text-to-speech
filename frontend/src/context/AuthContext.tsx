import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/auth';
import { authApi, setAuthToken } from '../services/authApi';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: (initialMode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authModalMode: 'login' | 'register';
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, fullName?: string) => Promise<void>;
  googleLogin: (credential: string, email?: string, name?: string, avatar?: string) => Promise<void>;
  linkGoogle: (credential: string, email?: string, name?: string, avatar?: string) => Promise<void>;
  unlinkGoogle: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, pass: string) => {
    const res = await authApi.login(email, pass);
    setUser(res.user);
    closeAuthModal();
  };

  const register = async (email: string, pass: string, fullName?: string) => {
    const res = await authApi.register(email, pass, fullName);
    setUser(res.user);
    closeAuthModal();
  };

  const googleLogin = async (credential: string, email?: string, name?: string, avatar?: string) => {
    const res = await authApi.googleLogin(credential, email, name, avatar);
    setUser(res.user);
    closeAuthModal();
  };

  const linkGoogle = async (credential: string, email?: string, name?: string, avatar?: string) => {
    const updatedUser = await authApi.linkGoogle(credential, email, name, avatar);
    setUser(updatedUser);
  };

  const unlinkGoogle = async () => {
    const updatedUser = await authApi.unlinkGoogle();
    setUser(updatedUser);
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalMode,
        login,
        register,
        googleLogin,
        linkGoogle,
        unlinkGoogle,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
