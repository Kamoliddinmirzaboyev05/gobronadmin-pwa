import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AdminProfile } from '../types';
import { authApi, settingsApi } from '../api';

interface AuthContextType {
  isAuthenticated: boolean;
  admin: AdminProfile | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem('admin_token')
  );
  const [admin, setAdmin] = useState<AdminProfile | null>(null);

  const refreshAdmin = useCallback(async () => {
    try {
      const profile = await settingsApi.getProfile();
      setAdmin(profile);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAdmin();
    }
  }, [isAuthenticated, refreshAdmin]);

  const login = async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    localStorage.setItem('admin_token', data.access);
    if (data.refresh) localStorage.setItem('admin_refresh', data.refresh);
    setAdmin(data.admin);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh');
    setAdmin(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, admin, login, logout, refreshAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
