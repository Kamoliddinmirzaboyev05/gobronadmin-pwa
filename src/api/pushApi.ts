/**
 * Push API — Backend bilan Push-bildirishnomalar uchun integratsiya.
 *
 * Bu modul:
 *  - Subscription yaratish/o'chirish
 *  - Push xabar yuborish
 *  - Test xabar yuborish
 */

import { apiClient } from './index';

// ─── Types ────────────────────────────────────────────────────

export interface PushSubscriptionRequest {
  subscription: PushSubscription;
  userAgent?: string;
  createdAt?: string;
}

export interface PushSubscriptionResponse {
  id: number;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: string;
}

export interface PushTestRequest {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    [key: string]: any;
  };
  tag?: string;
}

export interface PushTestResponse {
  success: boolean;
  message?: string;
}

// ─── API Client ───────────────────────────────────────────────

export const pushApi = {
  /**
   * Yangi subscription yaratish.
   */
  async subscribe(subscription: PushSubscriptionRequest): Promise<PushSubscriptionResponse> {
    const response = await apiClient.post<PushSubscriptionResponse>('/push/subscribe/', subscription);
    return response.data;
  },

  /**
   * Subscription ni o'chirish.
   */
  async unsubscribe(endpoint: string): Promise<void> {
    await apiClient.post('/push/unsubscribe/', { endpoint });
  },

  /**
   * Test push xabar yuborish.
   */
  async sendTestNotification(payload: PushTestRequest): Promise<PushTestResponse> {
    const response = await apiClient.post<PushTestResponse>('/push/test/', payload);
    return response.data;
  },

  /**
   * Barcha subscriptionlarni olish (admin uchun).
   */
  async getSubscriptions(): Promise<PushSubscriptionResponse[]> {
    const response = await apiClient.get<PushSubscriptionResponse[]>('/push/subscriptions/');
    return response.data;
  },
};
