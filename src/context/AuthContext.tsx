import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { AdminProfile, RegisterRequest } from '../types';
import { authApi, settingsApi } from '../api';

interface AuthContextType {
  isAuthenticated: boolean;
  admin: AdminProfile | null;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshAdmin: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 daqiqa

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem('admin_token')
  );
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const startRefreshTimer = useCallback(() => {
    stopRefreshTimer();
    refreshTimerRef.current = setInterval(async () => {
      try {
        await authApi.refreshToken();
      } catch {
        // Sessiya tugadi
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh');
        setAdmin(null);
        setIsAuthenticated(false);
        stopRefreshTimer();
        window.location.href = '/login';
      }
    }, TOKEN_REFRESH_INTERVAL);
  }, [stopRefreshTimer]);

  const refreshAdmin = useCallback(async () => {
    try {
      const profile = await settingsApi.getProfile();
      setAdmin(profile);
    } catch {
      // ignore
    }
  }, []);

  // Initial auth check
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('admin_token');
      if (token) {
        try {
          // Try to refresh token on mount to ensure validity
          await authApi.refreshToken();
          await refreshAdmin();
          setIsAuthenticated(true);
          startRefreshTimer();
        } catch {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_refresh');
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };
    init();

    return () => stopRefreshTimer();
  }, [refreshAdmin, startRefreshTimer, stopRefreshTimer]);

  const login = async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    setAdmin(data.admin);
    setIsAuthenticated(true);
    startRefreshTimer();
  };

  const register = async (data: RegisterRequest) => {
    const result = await authApi.register(data);
    setAdmin(result.admin);
    setIsAuthenticated(true);
    startRefreshTimer();
  };

  const logout = () => {
    stopRefreshTimer();
    authApi.logout().catch(() => {});
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh');
    setAdmin(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, admin, login, register, logout, refreshAdmin, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
