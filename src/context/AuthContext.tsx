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

const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 daqiqa (15 daqiqalik token uchun xavfsiz)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // localStorage'dan dastlabki qiymatni olish
  const getInitialAuth = () => {
    try {
      const token = localStorage.getItem('admin_token');
      return !!token;
    } catch {
      return false;
    }
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(getInitialAuth);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initRef = useRef(false);

  // Token'ni faqat localStorage'ga saqlash
  const saveToken = (token: string, refresh?: string) => {
    try {
      localStorage.setItem('admin_token', token);
      if (refresh) {
        localStorage.setItem('admin_refresh', refresh);
      }
      if (import.meta.env.DEV) {
        console.log('[Auth] Tokens saved to localStorage');
      }
    } catch (error) {
      console.error('[Auth] Failed to save tokens:', error);
    }
  };

  // Token'ni olish
  const getToken = () => {
    try {
      return localStorage.getItem('admin_token');
    } catch {
      return null;
    }
  };

  // Token'ni tozalash
  const clearTokens = () => {
    try {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh');
      if (import.meta.env.DEV) {
        console.log('[Auth] Tokens cleared from localStorage');
      }
    } catch (error) {
      console.error('[Auth] Failed to clear tokens:', error);
    }
  };

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
        if (import.meta.env.DEV) {
          console.log('[Auth] Token refreshed automatically');
        }
      } catch (error: unknown) {
        const err = error as Error;
        if (import.meta.env.DEV) {
          console.error('[Auth] Auto refresh failed:', err);
        }
        
        // Faqat haqiqiy auth xatoligida tozalaymiz
        if (err.message === 'Sessiya tugadi' || err.message?.includes('401')) {
          clearTokens();
          setAdmin(null);
          setIsAuthenticated(false);
          stopRefreshTimer();
          window.location.href = '/login';
        }
      }
    }, TOKEN_REFRESH_INTERVAL);
  }, [stopRefreshTimer]);

  const refreshAdmin = useCallback(async () => {
    try {
      const profile = await settingsApi.getProfile();
      setAdmin(profile);
      if (import.meta.env.DEV) {
        console.log('[Auth] Admin profile refreshed');
      }
    } catch (error) {
      console.error('[Auth] Failed to refresh admin profile:', error);
      throw error;
    }
  }, []);

  // Initial auth check - faqat bir marta ishga tushadi
  useEffect(() => {
    if (initRef.current) {
      if (import.meta.env.DEV) {
        console.log('[Auth] Init already ran, skipping');
      }
      return;
    }
    initRef.current = true;
    if (import.meta.env.DEV) {
      console.log('[Auth] Initializing authentication...');
    }

    const init = async () => {
      try {
        const token = getToken();
        if (import.meta.env.DEV) {
          console.log('[Auth] Token found:', !!token);
        }
        
        if (!token) {
          if (import.meta.env.DEV) {
            console.log('[Auth] No token, user not authenticated');
          }
          setIsAuthenticated(false);
          setAdmin(null);
          setIsLoading(false);
          return;
        }

        // Token mavjud - profilni olishga harakat qilamiz
        if (import.meta.env.DEV) {
          console.log('[Auth] Fetching user profile...');
        }
        try {
          // settingsApi.getProfile() ichida apiFetch ishlatilgan, u avtomatik refresh qiladi
          const profile = await settingsApi.getProfile();
          if (import.meta.env.DEV) {
            console.log('[Auth] Profile fetched successfully');
          }
          setAdmin(profile);
          setIsAuthenticated(true);
          startRefreshTimer();
        } catch (profileError: unknown) {
          const error = profileError as Error;
          if (import.meta.env.DEV) {
            console.log('[Auth] Profile fetch failed:', error.message);
          }
          
          // Agar xatolik "Sessiya tugadi" bo'lsa (refresh o'xshamagan), login'ga
          if (error.message === 'Sessiya tugadi' || error.message?.includes('401')) {
            if (import.meta.env.DEV) {
              console.log('[Auth] Session expired, clearing...');
            }
            clearTokens();
            setIsAuthenticated(false);
            setAdmin(null);
          } else {
            // Boshqa xatolik (masalan, tarmoq xatosi) - tokenni o'chirmaymiz!
            // Lekin isAuthenticated'ni true qilamiz, chunki tokenimiz bor
            if (import.meta.env.DEV) {
              console.log('[Auth] Non-auth error, keeping session based on token existence');
            }
            setIsAuthenticated(true);
            // Profilni keyinroq qayta urinib ko'rish mumkin
          }
        }
      } catch (error) {
        console.error('[Auth] Initialization error:', error);
        setIsAuthenticated(false);
        setAdmin(null);
      } finally {
        setIsLoading(false);
        if (import.meta.env.DEV) {
          console.log('[Auth] Initialization complete');
        }
      }
    };
    
    init();

    return () => {
      if (import.meta.env.DEV) {
        console.log('[Auth] Cleanup: stopping refresh timer');
      }
      stopRefreshTimer();
    };
  }, [startRefreshTimer, stopRefreshTimer]);

  const login = async (username: string, password: string) => {
    try {
      if (import.meta.env.DEV) {
        console.log('[Auth] Logging in...');
      }
      const data = await authApi.login(username, password);
      saveToken(data.access, data.refresh);
      setAdmin(data.admin);
      setIsAuthenticated(true);
      startRefreshTimer();
      if (import.meta.env.DEV) {
        console.log('[Auth] Login successful');
      }
    } catch (error) {
      console.error('[Auth] Login error:', error);
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      if (import.meta.env.DEV) {
        console.log('[Auth] Registering...');
      }
      const result = await authApi.register(data);
      saveToken(result.access, result.refresh);
      setAdmin(result.admin);
      setIsAuthenticated(true);
      startRefreshTimer();
      if (import.meta.env.DEV) {
        console.log('[Auth] Registration successful');
      }
    } catch (error) {
      console.error('[Auth] Register error:', error);
      throw error;
    }
  };

  const logout = () => {
    if (import.meta.env.DEV) {
      console.log('[Auth] Logging out...');
    }
    stopRefreshTimer();
    authApi.logout().catch(() => {});
    clearTokens();
    setAdmin(null);
    setIsAuthenticated(false);
    if (import.meta.env.DEV) {
      console.log('[Auth] Logout complete');
    }
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
