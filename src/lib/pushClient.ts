/**
 * PushClient — Push-bildirishnomalar uchun yuqori darajali client.
 *
 * Bu modul:
 *  - Push subscription yaratish/boshqarish
 *  - Push xabar yuborish (frontend orqali test uchun)
 *  - VAPID kalitlari bilan ishlash
 *  - Xatoliklarni boshqarish
 */

import { VAPID_PUBLIC_KEY, PUSH_API_BASE } from './pushConfig';

// ─── Types ────────────────────────────────────────────────────

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

// PushSubscriptionJSON — browser native type
// https://developer.mozilla.org/en-US/docs/Web/API/PushSubscriptionJSON

// ─── Helper: VAPID key → Uint8Array ──────────────────────────
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// ─── Helper: Service Worker registration ──────────────────────
async function getSWRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker brauzerda qo\'llab-quvvatlanmaydi');
  }

  const registration = await navigator.serviceWorker.ready;
  return registration;
}

// ─── Helper: Subscription yaratish ────────────────────────────
export async function createPushSubscription(): Promise<PushSubscription> {
  const registration = await getSWRegistration();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  return subscription;
}

// ─── Helper: Joriy subscription ni olish ──────────────────────
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const registration = await getSWRegistration();
  return await registration.pushManager.getSubscription();
}

// ─── Helper: Subscription ni o'chirish ────────────────────────
export async function removePushSubscription(subscription: PushSubscription): Promise<void> {
  await subscription.unsubscribe();
}

// ─── Helper: Backendga yuborish ───────────────────────────────
export async function subscribeToPushBackend(subscription: PushSubscription): Promise<void> {
  const token = localStorage.getItem('admin_token');

  if (!token) {
    throw new Error('Foydalanuvchi tizimga kirmagan');
  }

  const response = await fetch(`${PUSH_API_BASE}/push/subscribe/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Backend xatoligi: ${response.status} ${response.statusText}`);
  }
}

// ─── Helper: Backenddan o'chirish ─────────────────────────────
export async function unsubscribeFromPushBackend(subscription: PushSubscription): Promise<void> {
  const token = localStorage.getItem('admin_token');

  if (!token) return;

  await fetch(`${PUSH_API_BASE}/push/unsubscribe/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
    }),
  });
}

// ─── Helper: Test push xabar yuborish ─────────────────────────
export async function sendTestNotification(payload: PushPayload): Promise<void> {
  const token = localStorage.getItem('admin_token');

  try {
    await fetch(`${PUSH_API_BASE}/push/test/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Backend yo'q bo'lsa — to'g'ridan-to'g'ri SW orqali ko'rsatamiz
    const registration = await getSWRegistration();
    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
      data: { url: payload.data?.url || '/' },
      tag: payload.tag || 'test-notification',
    });
  }
}

// ─── Helper: Bildirishnoma ko'rsatish (SW orqali) ─────────────
export async function showNotification(payload: PushPayload): Promise<void> {
  const registration = await getSWRegistration();
  await registration.showNotification(payload.title, {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    data: payload.data,
    tag: payload.tag,
    renotify: payload.renotify,
    requireInteraction: payload.requireInteraction,
    vibrate: payload.vibrate,
    actions: payload.actions,
  });
}

// ─── Helper: iOS moslik ───────────────────────────────────────
export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

// ─── Helper: Push qo'llab-quvvatlanishini tekshirish ──────────
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// ─── Helper: Permission holatini olish ────────────────────────
export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

// ─── Helper: Permission so'rash ───────────────────────────────
export async function requestNotificationPermission(): Promise<'granted' | 'denied'> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
}
