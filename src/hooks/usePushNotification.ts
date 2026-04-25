/**
 * usePushNotification
 *
 * Web Push bildirishnomalarini boshqarish uchun hook.
 *
 * Imkoniyatlar:
 *  - Ruxsat so'rash (permission request)
 *  - Push subscription yaratish (VAPID bilan)
 *  - Subscription ni backendga yuborish
 *  - Subscription ni bekor qilish (unsubscribe)
 *  - iOS / Android moslik tekshiruvi
 */

import { useState, useEffect, useCallback } from 'react';
import { VAPID_PUBLIC_KEY, PUSH_API_BASE } from '../lib/pushConfig';

// ─── Types ────────────────────────────────────────────────────
export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export interface PushState {
  permission: PushPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
  isIOS: boolean;
}

// ─── Helper: VAPID key → Uint8Array ──────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// ─── Helper: iOS tekshiruvi ───────────────────────────────────
function detectIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

// ─── Helper: Push qo'llab-quvvatlanishini tekshirish ─────────
function checkSupport(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// ─── Main Hook ────────────────────────────────────────────────
export function usePushNotification() {
  const [state, setState] = useState<PushState>({
    permission: 'default',
    isSubscribed: false,
    isLoading: false,
    error: null,
    isSupported: checkSupport(),
    isIOS: detectIOS(),
  });

  // Joriy holat ni tekshirish (mount da)
  useEffect(() => {
    if (!checkSupport()) return;

    const currentPermission = Notification.permission as PushPermission;
    setState((prev) => ({ ...prev, permission: currentPermission }));

    // Allaqachon subscription bor-yo'qligini tekshirish
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setState((prev) => ({ ...prev, isSubscribed: !!sub }));
      })
      .catch(() => {});
  }, []);

  /**
   * Foydalanuvchidan bildirishnomaga ruxsat so'rash va
   * Push subscription yaratish.
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!checkSupport()) {
      setState((prev) => ({
        ...prev,
        error: 'Bu brauzer Push bildirishnomalarni qo\'llab-quvvatlamaydi',
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // 1. Ruxsat so'rash
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        setState((prev) => ({
          ...prev,
          permission: permission as PushPermission,
          isLoading: false,
          error:
            permission === 'denied'
              ? 'Bildirishnomalar bloklangan. Brauzer sozlamalaridan yoqing.'
              : 'Bildirishnomaga ruxsat berilmadi.',
        }));
        return false;
      }

      // 2. Service Worker tayyor bo'lishini kutish
      const registration = await navigator.serviceWorker.ready;

      // 3. Mavjud subscription ni tekshirish
      let subscription = await registration.pushManager.getSubscription();

      // 4. Subscription yo'q bo'lsa yangi yaratish
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true, // Har bir push xabar ko'rinishi shart (brauzer talabi)
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // 5. Subscription ni backendga yuborish
      await sendSubscriptionToServer(subscription);

      setState((prev) => ({
        ...prev,
        permission: 'granted',
        isSubscribed: true,
        isLoading: false,
        error: null,
      }));

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Noma\'lum xatolik yuz berdi';

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: `Subscription xatoligi: ${message}`,
      }));

      return false;
    }
  }, []);

  /**
   * Push subscription ni bekor qilish.
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Backenddan ham o'chirish
        await removeSubscriptionFromServer(subscription);
        // Browserdan o'chirish
        await subscription.unsubscribe();
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Xatolik';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      return false;
    }
  }, []);

  /**
   * Test push xabar yuborish (faqat mock/dev uchun).
   * Real loyihada bu backend orqali amalga oshiriladi.
   */
  const sendTestNotification = useCallback(async () => {
    if (!state.isSubscribed) return;

    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`${PUSH_API_BASE}/push/test/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Mock rejimda backend yo'q — SW orqali to'g'ridan-to'g'ri ko'rsatamiz
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification('GoBron Admin — Test', {
        body: 'Push bildirishnomalar muvaffaqiyatli sozlandi! ✅',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'test-notification',
        data: { url: '/dashboard' },
      });
    }
  }, [state.isSubscribed]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

// ─── Backend API calls ────────────────────────────────────────

/**
 * Subscription ni backendga yuborish.
 * Backend bu ma'lumotni DB ga saqlaydi va keyinchalik push yuborish uchun ishlatadi.
 */
async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  const token = localStorage.getItem('admin_token');

  const response = await fetch(`${PUSH_API_BASE}/push/subscribe/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      // Qo'shimcha meta ma'lumotlar
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString(),
    }),
  });

  // Mock rejimda 404 kelishi normal — ignore qilamiz
  if (!response.ok && response.status !== 404 && response.status !== 405) {
    throw new Error(`Server xatoligi: ${response.status}`);
  }
}

/**
 * Subscription ni backenddan o'chirish.
 */
async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  const token = localStorage.getItem('admin_token');

  await fetch(`${PUSH_API_BASE}/push/unsubscribe/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
    }),
  }).catch(() => {}); // Backend yo'q bo'lsa ignore
}
