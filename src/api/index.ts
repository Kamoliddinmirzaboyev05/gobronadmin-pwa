import type {
  DashboardStats,
  Booking,
  BookingFilters,
  Field,
  Notification,
  AdminProfile,
  PaginatedResponse,
  Amenity,
  PushSubscriptionRequest,
  PushSubscriptionResponse,
  PushTestRequest,
  PushTestResponse,
} from '../types';
import {
  mockAdmin,
  mockFields as _mockFields,
  mockBookings as _mockBookings,
  mockNotifications as _mockNotifications,
  mockDashboardStats,
} from './mockData';

// ─── In-memory store ──────────────────────────────────────────────────────────
let bookings: Booking[] = JSON.parse(JSON.stringify(_mockBookings));
let notifications: Notification[] = JSON.parse(JSON.stringify(_mockNotifications));
let adminProfile: AdminProfile = { ...mockAdmin };
let nextNotifId = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

function paginate<T>(items: T[], page = 1, pageSize = 20): PaginatedResponse<T> {
  const start = (page - 1) * pageSize;
  return {
    count: items.length,
    next: start + pageSize < items.length ? 'next' : null,
    previous: page > 1 ? 'prev' : null,
    results: items.slice(start, start + pageSize),
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

function getToken() {
  return localStorage.getItem('admin_token');
}

function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...authHeader(),
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || errData.message || `Xatolik: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Token refresh helper ─────────────────────────────────────────────────────
export const authApi = {
  login: async (username: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || errData.message || 'Login xatosi');
    }

    const data = await res.json();
    const user = data.user;

    const admin: AdminProfile = {
      ...user,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      email: user.email || user.username,
      avatar: user.avatar_url || undefined,
    };

    localStorage.setItem('admin_token', data.access);
    if (data.refresh) localStorage.setItem('admin_refresh', data.refresh);
    return { access: data.access, refresh: data.refresh, admin };
  },

  register: async (payload: import('../types').RegisterRequest) => {
    const res = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const message = errData.detail || errData.message || Object.values(errData).flat().join(', ') || 'Ro\'yxatdan o\'tishda xatolik';
      throw new Error(message);
    }

    const data = await res.json();
    const user = data.user;

    const admin: AdminProfile = {
      ...user,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      email: user.email || user.username,
      avatar: user.avatar_url || undefined,
    };

    localStorage.setItem('admin_token', data.access);
    if (data.refresh) localStorage.setItem('admin_refresh', data.refresh);
    return { access: data.access, refresh: data.refresh, admin };
  },

  refreshToken: async (): Promise<string> => {
    const refresh = localStorage.getItem('admin_refresh');
    if (!refresh) throw new Error('Refresh token mavjud emas');

    const res = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh');
      throw new Error('Sessiya tugadi');
    }

    const data = await res.json();
    localStorage.setItem('admin_token', data.access);
    return data.access;
  },

  logout: async () => {
    const refresh = localStorage.getItem('admin_refresh');
    const token = localStorage.getItem('admin_token');
    if (refresh && token) {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ refresh }),
      }).catch(() => {});
    }
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh');
  },
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    await delay(400);
    return {
      ...mockDashboardStats,
      recent_bookings: bookings.slice(0, 10),
      bookings_by_status: {
        pending: bookings.filter((b) => b.status === 'pending').length,
        confirmed: bookings.filter((b) => b.status === 'confirmed').length,
        rejected: bookings.filter((b) => b.status === 'rejected').length,
        cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      },
    };
  },
};

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookingsApi = {
  getAll: async (filters: BookingFilters = {}): Promise<PaginatedResponse<Booking>> => {
    await delay(350);
    let result = [...bookings];

    if (filters.status) result = result.filter((b) => b.status === filters.status);
    if (filters.field_id) result = result.filter((b) => b.field.id === Number(filters.field_id));
    if (filters.date_from) result = result.filter((b) => b.date >= filters.date_from!);
    if (filters.date_to) result = result.filter((b) => b.date <= filters.date_to!);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (b) =>
          b.user.name.toLowerCase().includes(q) ||
          b.user.phone.includes(q)
      );
    }

    // Ordering
    const ord = filters.ordering || '-created_at';
    const desc = ord.startsWith('-');
    const key = ord.replace('-', '') as keyof Booking;
    result.sort((a, b) => {
      const av = a[key] ?? '';
      const bv = b[key] ?? '';
      return desc ? (av < bv ? 1 : -1) : (av > bv ? 1 : -1);
    });

    return paginate(result, filters.page || 1, 20);
  },

  getById: async (id: number): Promise<Booking> => {
    await delay(200);
    const b = bookings.find((b) => b.id === id);
    if (!b) throw new Error('Bron topilmadi');
    return { ...b };
  },

  confirm: async (id: number): Promise<Booking> => {
    await delay(300);
    const idx = bookings.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Bron topilmadi');
    bookings[idx] = {
      ...bookings[idx],
      status: 'confirmed',
      status_history: [
        ...(bookings[idx].status_history || []),
        { status: 'confirmed', changed_at: new Date().toISOString(), changed_by: adminProfile.name },
      ],
    };
    _addNotif(`${bookings[idx].user.name} bronini tasdiqlandi`, bookings[idx].id);
    return { ...bookings[idx] };
  },

  reject: async (id: number, reason: string): Promise<Booking> => {
    await delay(300);
    const idx = bookings.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Bron topilmadi');
    bookings[idx] = {
      ...bookings[idx],
      status: 'rejected',
      reject_reason: reason,
      status_history: [
        ...(bookings[idx].status_history || []),
        { status: 'rejected', changed_at: new Date().toISOString(), changed_by: adminProfile.name, note: reason },
      ],
    };
    return { ...bookings[idx] };
  },

  cancel: async (id: number): Promise<Booking> => {
    await delay(300);
    const idx = bookings.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Bron topilmadi');
    bookings[idx] = {
      ...bookings[idx],
      status: 'cancelled',
      status_history: [
        ...(bookings[idx].status_history || []),
        { status: 'cancelled', changed_at: new Date().toISOString() },
      ],
    };
    return { ...bookings[idx] };
  },

  exportCsv: async (): Promise<Response> => {
    await delay(400);
    const header = 'ID,Foydalanuvchi,Telefon,Maydon,Sana,Boshlanish,Tugash,Narx,Holat\n';
    const rows = bookings.map((b) =>
      `${b.id},"${b.user.name}","${b.user.phone}","${b.field.name}","${b.date}","${b.start_time}","${b.end_time}","${b.total_price}","${b.status}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    return new Response(blob);
  },
};

// ─── Fields ───────────────────────────────────────────────────────────────────
function normalizeField(raw: any): Field {
  return {
    id: raw.id,
    name: raw.name || '',
    description: raw.description || '',
    address: raw.address || '',
    city: raw.city || '',
    price_per_hour: raw.price_per_hour ?? 0,
    opening_time: (raw.opening_time || '08:00').slice(0, 5),
    closing_time: (raw.closing_time || '22:00').slice(0, 5),
    is_active: raw.is_active ?? true,
    cover_image: raw.cover_image_url || raw.cover_image || undefined,
    cover_image_url: raw.cover_image_url || null,
    images: raw.images || [],
    amenities: raw.amenities || [],
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    location_url: raw.location_url || null,
    phone: raw.phone || '',
    advance_booking_days: raw.advance_booking_days,
    subscription_valid: raw.subscription_valid,
  };
}

export const fieldsApi = {
  getAll: async (): Promise<Field[]> => {
    const data = await apiFetch<PaginatedResponse<any>>(`${API_BASE_URL}/admin/fields/`);
    return (data.results || []).map(normalizeField);
  },

  getById: async (id: number): Promise<Field> => {
    const data = await apiFetch<any>(`${API_BASE_URL}/admin/fields/${id}/`);
    return normalizeField(data);
  },

  create: async (data: Partial<Field>): Promise<Field> => {
    const payload = {
      name: data.name,
      description: data.description || '',
      address: data.address || '',
      city: data.city || 'Toshkent',
      price_per_hour: Number(data.price_per_hour) || 0,
      opening_time: data.opening_time ? `${data.opening_time}:00` : '08:00:00',
      closing_time: data.closing_time ? `${data.closing_time}:00` : '22:00:00',
      is_active: data.is_active ?? true,
    };
    const res = await apiFetch<any>(`${API_BASE_URL}/admin/fields/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return normalizeField(res);
  },

  update: async (id: number, data: Partial<Field>): Promise<Field> => {
    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.address !== undefined) payload.address = data.address;
    if (data.city !== undefined) payload.city = data.city;
    if (data.price_per_hour !== undefined) payload.price_per_hour = Number(data.price_per_hour);
    if (data.opening_time !== undefined) payload.opening_time = `${data.opening_time}:00`;
    if (data.closing_time !== undefined) payload.closing_time = `${data.closing_time}:00`;
    if (data.is_active !== undefined) payload.is_active = data.is_active;

    const res = await apiFetch<any>(`${API_BASE_URL}/admin/fields/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return normalizeField(res);
  },

  toggleActive: async (id: number): Promise<Field> => {
    const current = await fieldsApi.getById(id);
    return fieldsApi.update(id, { is_active: !current.is_active });
  },

  delete: async (id: number): Promise<void> => {
    await apiFetch<any>(`${API_BASE_URL}/admin/fields/${id}/`, {
      method: 'DELETE',
    });
  },

  // Images
  uploadImage: async (fieldId: number, formData: FormData): Promise<{ id: number; image: string; order: number }> => {
    const res = await fetch(`${API_BASE_URL}/admin/fields/${fieldId}/images/`, {
      method: 'POST',
      headers: authHeader(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Rasm yuklashda xatolik');
    }
    const data = await res.json();
    return { id: data.id, image: data.image || data.image_url || data.url, order: data.order || 1 };
  },

  deleteImage: async (fieldId: number, imageId: number): Promise<void> => {
    await apiFetch<any>(`${API_BASE_URL}/admin/fields/${fieldId}/images/${imageId}/`, {
      method: 'DELETE',
    });
  },

  reorderImages: async (fieldId: number, order: number[]): Promise<void> => {
    await apiFetch<any>(`${API_BASE_URL}/admin/fields/${fieldId}/images/reorder/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });
  },

  // Amenities
  addAmenity: async (fieldId: number, data: Partial<Amenity>): Promise<Amenity> => {
    const res = await apiFetch<any>(`${API_BASE_URL}/admin/fields/${fieldId}/amenities/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return { id: res.id, icon: res.icon || '⚽', name: res.name || '' };
  },

  deleteAmenity: async (fieldId: number, amenityId: number): Promise<void> => {
    await apiFetch<any>(`${API_BASE_URL}/admin/fields/${fieldId}/amenities/${amenityId}/`, {
      method: 'DELETE',
    });
  },
};

// ─── Notifications ────────────────────────────────────────────────────────────
function _addNotif(message: string, bookingId?: number) {
  notifications.unshift({
    id: nextNotifId++,
    message,
    booking_id: bookingId,
    is_read: false,
    created_at: new Date().toISOString(),
  });
}

export const notificationsApi = {
  getAll: async (): Promise<Notification[]> => {
    await delay(200);
    return [...notifications];
  },

  markAllRead: async (): Promise<void> => {
    await delay(200);
    notifications = notifications.map((n) => ({ ...n, is_read: true }));
  },

  markRead: async (id: number): Promise<void> => {
    await delay(150);
    notifications = notifications.map((n) => n.id === id ? { ...n, is_read: true } : n);
  },
};

// ─── Settings / Profile ───────────────────────────────────────────────────────
function normalizeProfile(raw: any): AdminProfile {
  return {
    id: raw.id,
    username: raw.username || '',
    first_name: raw.first_name || '',
    last_name: raw.last_name || '',
    phone: raw.phone || raw.phone_number || undefined,
    role: raw.role || undefined,
    avatar_url: raw.avatar_url || null,
    date_joined: raw.date_joined,
    name: `${raw.first_name || ''} ${raw.last_name || ''}`.trim() || raw.username || '',
    email: raw.email || raw.username || '',
    avatar: raw.avatar_url || undefined,
    email_notifications: raw.email_notifications ?? true,
  };
}

export const settingsApi = {
  getProfile: async (): Promise<AdminProfile> => {
    const data = await apiFetch<any>(`${API_BASE_URL}/auth/me/`);
    return normalizeProfile(data);
  },

  updateProfile: async (data: Partial<AdminProfile>): Promise<AdminProfile> => {
    const payload: Record<string, any> = {};
    if (data.first_name !== undefined) payload.first_name = data.first_name;
    if (data.last_name !== undefined) payload.last_name = data.last_name;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.email !== undefined) payload.email = data.email;
    if (data.email_notifications !== undefined) payload.email_notifications = data.email_notifications;

    const res = await apiFetch<any>(`${API_BASE_URL}/auth/me/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return normalizeProfile(res);
  },

  changePassword: async (old_password: string, new_password: string): Promise<void> => {
    await apiFetch<any>(`${API_BASE_URL}/auth/password/change/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_password, new_password }),
    });
  },
};

// ─── Push Notifications ───────────────────────────────────────────────────────
export const pushApi = {
  subscribe: async (data: PushSubscriptionRequest): Promise<PushSubscriptionResponse> => {
    await delay(300);
    // Mock: return dummy subscription data
    const sub = data.subscription as any;
    return {
      id: Math.floor(Math.random() * 10000),
      endpoint: data.subscription.endpoint,
      keys: {
        p256dh: sub.keys?.p256dh || '',
        auth: sub.keys?.auth || '',
      },
      createdAt: new Date().toISOString(),
    };
  },

  unsubscribe: async (_endpoint: string): Promise<void> => {
    await delay(200);
    // Mock: no-op
  },

  sendTestNotification: async (_payload: PushTestRequest): Promise<PushTestResponse> => {
    await delay(300);
    return { success: true, message: 'Test bildirishnoma yuborildi' };
  },

  getSubscriptions: async (): Promise<PushSubscriptionResponse[]> => {
    await delay(200);
    return [];
  },
};
