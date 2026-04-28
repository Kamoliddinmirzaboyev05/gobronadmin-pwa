import { PUSH_CONFIG } from './pushConfig';

/**
 * Brauzer push-bildirishnomalarni qo'llab-quvvatlashini tekshirish.
 */
export const isPushSupported = () => {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

/**
 * iOS qurilmasi ekanligini tekshirish.
 */
export const isIOS = () => {
  return (
    ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(
      navigator.platform
    ) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  );
};

/**
 * Bildirishnoma ruxsatini olish.
 */
export const getNotificationPermission = async (): Promise<NotificationPermission> => {
  return Notification.permission;
};

/**
 * Ruxsat so'rash.
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Base64 stringni Uint8Array ga o'tkazish (VAPID key uchun).
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Push subscription yaratish.
 */
export const createPushSubscription = async (): Promise<PushSubscription> => {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUSH_CONFIG.VAPID_PUBLIC_KEY),
  });
  return subscription;
};

/**
 * Mavjud subscription ni olish.
 */
export const getCurrentSubscription = async (): Promise<PushSubscription | null> => {
  const registration = await navigator.serviceWorker.ready;
  return await registration.pushManager.getSubscription();
};

/**
 * Subscription ni o'chirish.
 */
export const removePushSubscription = async (subscription: PushSubscription): Promise<boolean> => {
  return await subscription.unsubscribe();
};

/**
 * Backendga obunani yuborish.
 */
export const subscribeToPushBackend = async (subscription: PushSubscription) => {
  // Bu yerda API orqali backendga yuborish kerak
  console.log('Push subscription sent to backend:', subscription);
  // return api.post('/push/subscribe', subscription);
};

/**
 * Backenddan obunani o'chirish.
 */
export const unsubscribeFromPushBackend = async (subscription: PushSubscription) => {
  // Bu yerda API orqali backenddan o'chirish kerak
  console.log('Push subscription removed from backend:', subscription);
  // return api.post('/push/unsubscribe', { endpoint: subscription.endpoint });
};

/**
 * Lokal bildirishnoma ko'rsatish.
 */
export const showNotification = async (payload: { title: string; body: string; icon?: string }) => {
  if (Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: '/favicon.svg',
    });
  }
};
