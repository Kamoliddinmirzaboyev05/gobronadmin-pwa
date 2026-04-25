import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  isIOS,
  getNotificationPermission,
  requestNotificationPermission,
  createPushSubscription,
  getCurrentSubscription,
  removePushSubscription,
  subscribeToPushBackend,
  unsubscribeFromPushBackend,
  showNotification,
} from '../lib/pushClient';

// ─── Types ────────────────────────────────────────────────────

export interface PushContextType {
  isSupported: boolean;
  isIOS: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  showNotification: (payload: PushPayload) => Promise<void>;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    [key: string]: any;
  };
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  vibrate?: number[];
  actions?: Array<{ action: string; title: string }>;
}

// ─── Context ──────────────────────────────────────────────────

const PushContext = createContext<PushContextType | null>(null);

export function PushProvider({ children }: { children: React.ReactNode }) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Joriy holat ni tekshirish (mount da)
  useEffect(() => {
    if (!isPushSupported()) {
      setError('Bu brauzer Push bildirishnomalarni qo\'llab-quvvatlamaydi');
      return;
    }

    getNotificationPermission().then(setPermission);

    getCurrentSubscription().then((sub) => {
      setIsSubscribed(!!sub);
    });
  }, []);

  /**
   * Push-bildirishnomalarga obuna bo'lish.
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported()) {
      setError('Push qo\'llab-quvvatlanmaydi');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Ruxsat so'rash
      const newPermission = await requestNotificationPermission();

      if (newPermission !== 'granted') {
        setPermission(newPermission);
        setError(
          newPermission === 'denied'
            ? 'Bildirishnomalar bloklangan. Brauzer sozlamalaridan yoqing.'
            : 'Bildirishnomaga ruxsat berilmadi.'
        );
        setIsLoading(false);
        return false;
      }

      setPermission(newPermission);

      // 2. Service Worker tayyor bo'lishini kutish
      const registration = await navigator.serviceWorker.ready;

      // 3. Mavjud subscription ni tekshirish
      let subscription = await registration.pushManager.getSubscription();

      // 4. Subscription yo'q bo'lsa yangi yaratish
      if (!subscription) {
        subscription = await createPushSubscription();
      }

      // 5. Backendga yuborish
      await subscribeToPushBackend(subscription);

      setIsSubscribed(true);
      setIsLoading(false);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Noma\'lum xatolik';
      setError(`Obuna xatoligi: ${message}`);
      setIsLoading(false);
      return false;
    }
  }, []);

  /**
   * Push-bildirishnomalardan chiqish.
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Backenddan ham o'chirish
        await unsubscribeFromPushBackend(subscription);
        // Browserdan o'chirish
        await removePushSubscription(subscription);
      }

      setIsSubscribed(false);
      setIsLoading(false);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Xatolik';
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, []);

  /**
   * Bildirishnoma ko'rsatish.
   */
  const showNotification = useCallback(async (payload: PushPayload): Promise<void> => {
    try {
      await showNotification(payload);
    } catch (err) {
      console.error('[PushContext] Notification ko\'rsatish xatoligi:', err);
    }
  }, []);

  return (
    <PushContext.Provider
      value={{
        isSupported: isPushSupported(),
        isIOS: isIOS(),
        permission,
        isSubscribed,
        isLoading,
        error,
        subscribe,
        unsubscribe,
        showNotification,
      }}
    >
      {children}
    </PushContext.Provider>
  );
}

export function usePush() {
  const ctx = useContext(PushContext);
  if (!ctx) {
    throw new Error('usePush must be used within PushProvider');
  }
  return ctx;
}
