import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Notification } from '../types';
import { notificationsApi } from '../api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastNotificationId, setLastNotificationId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationsApi.getAll();
      const notifList = Array.isArray(data) ? data : [];
      
      // Check for new notifications
      if (notifList.length > 0 && lastNotificationId !== null) {
        const newNotifications = notifList.filter(n => n.id > lastNotificationId && !n.is_read);
        if (newNotifications.length > 0) {
          // Show toast for the newest notification
          const newest = newNotifications[0];
          showToast(newest.message, 'info');
          
          // Show browser notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('GoBron - Yangi bildirishnoma', {
              body: newest.message,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              tag: `notification-${newest.id}`,
            });
          }
        }
      }
      
      // Update last notification ID
      if (notifList.length > 0) {
        setLastNotificationId(notifList[0].id);
      }
      
      setNotifications(notifList);
    } catch {
      // ignore
    }
  }, [isAuthenticated, lastNotificationId, showToast]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Initial load
    refresh();
    
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(refresh, 10000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, refresh]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (id: number) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
