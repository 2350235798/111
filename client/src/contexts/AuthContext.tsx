import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { logger } from '@client/src/utils/logger';
import { authApi, getToken, setToken, clearToken } from '@client/src/api/app';
import type { UserProfile, LoginRequest, RegisterRequest } from '@shared/api.interface';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const result = await authApi.getMe();
      setUser(result.user);
    } catch (err) {
      logger.error('获取用户信息失败', err);
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (data: LoginRequest) => {
    const result = await authApi.login(data);
    setToken(result.token);
    setUser(result.user);
  };

  const register = async (data: RegisterRequest) => {
    const result = await authApi.register(data);
    setToken(result.token);
    setUser(result.user);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
