import type {
  DashboardStats,
  Booking,
  BookingFilters,
  Field,
  FieldImage,
  Notification,
  AdminProfile,
  PaginatedResponse,
  Amenity,
  PushSubscriptionRequest,
  PushSubscriptionResponse,
  PushTestRequest,
  PushTestResponse,
  Slot,
  ManualBookingRequest,
} from '../types';
import {
  mockAdmin,
  mockBookings as _mockBookings,
  mockNotifications as _mockNotifications,
  mockDashboardStats,
} from './mockData';

// ─── In-memory store ──────────────────────────────────────────────────────────
const bookings: Booking[] = JSON.parse(JSON.stringify(_mockBookings));
const adminProfile: AdminProfile = { ...mockAdmin };
let notifications: Notification[] = JSON.parse(JSON.stringify(_mockNotifications));
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

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    'VITE_API_URL environment variable is not defined. ' +
    'Please create a .env file with VITE_API_URL=http://103.6.169.242/api'
  );
}

if (import.meta.env.DEV) {
  console.log('[API] Using API Base URL:', API_BASE_URL);
}

// Token'ni saqlash (faqat localStorage)
function saveToken(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to save ${key}:`, error);
  }
}

// Token'ni olish
function getToken() {
  try {
    return localStorage.getItem('admin_token');
  } catch {
    return null;
  }
}

// Token'ni o'chirish
function removeToken(key: string) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove ${key}:`, error);
  }
}

function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  
  const makeRequest = async (tokenToUse: string | null) => {
    return fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
        ...(options?.headers || {}),
      },
    });
  };

  let res = await makeRequest(token);

  // Agar 401 (Unauthorized) bo'lsa va refresh tokenimiz bo'lsa, tokenni yangilashga harakat qilamiz
  if (res.status === 401 && localStorage.getItem('admin_refresh')) {
    console.log('[API] Unauthorized (401), attempting token refresh...');
    try {
      const newAccessToken = await authApi.refreshToken();
      console.log('[API] Token refreshed successfully, retrying request...');
      res = await makeRequest(newAccessToken);
    } catch (refreshError: unknown) {
      console.error('[API] Token refresh failed during request:', refreshError);
      // Refresh ham o'xshamadi - xatoni qaytaramiz
      // Tokenlarni o'chirish refreshToken funksiyasining ichida bajariladi (agar 401/400 bo'lsa)
      throw refreshError;
    }
  }

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

    // localStorage'ga xavfsiz saqlash
    saveToken('admin_token', data.access);
    if (data.refresh) saveToken('admin_refresh', data.refresh);
    if (import.meta.env.DEV) {
      console.log('[API] Login tokens saved');
    }
    
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

    // localStorage'ga xavfsiz saqlash
    saveToken('admin_token', data.access);
    if (data.refresh) saveToken('admin_refresh', data.refresh);
    if (import.meta.env.DEV) {
      console.log('[API] Register tokens saved');
    }
    
    return { access: data.access, refresh: data.refresh, admin };
  },

  refreshToken: async (): Promise<string> => {
    const refresh = localStorage.getItem('admin_refresh');
    if (!refresh) throw new Error('Refresh token mavjud emas');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ refresh }),
      });

      if (res.status === 401 || res.status === 400) {
        // Faqat token yaroqsiz bo'lgandagina o'chiramiz
        removeToken('admin_token');
        removeToken('admin_refresh');
        throw new Error('Sessiya tugadi');
      }

      if (!res.ok) {
        throw new Error(`Server xatosi: ${res.status}`);
      }

      const data = await res.json();
      saveToken('admin_token', data.access);
      if (data.refresh) {
        saveToken('admin_refresh', data.refresh);
      }
      if (import.meta.env.DEV) {
        console.log('[API] Token refreshed successfully');
      }
      return data.access;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[API] Refresh error:', err);
      }
      throw err;
    }
  },

  logout: async () => {
    const refresh = localStorage.getItem('admin_refresh');
    const token = getToken();
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
    removeToken('admin_token');
    removeToken('admin_refresh');
    if (import.meta.env.DEV) {
      console.log('[API] Logout tokens cleared');
    }
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

  createManual: async (data: ManualBookingRequest): Promise<Booking> => {
    const res = await apiFetch<unknown>(`${API_BASE_URL}/admin/bookings/manual/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res as Booking;
  },
};

// ─── Fields ───────────────────────────────────────────────────────────────────
function normalizeField(raw: Record<string, unknown>): Field {
  const r = raw as Record<string, string | number | boolean | null | undefined | unknown[]>;
  return {
    id: r.id as number,
    name: (r.name as string) || '',
    description: (r.description as string) || '',
    address: (r.address as string) || '',
    city: (r.city as string) || '',
    price_per_hour: r.price_per_hour ? Number(r.price_per_hour) : 0,
    opening_time: ((r.opening_time as string) || '08:00').slice(0, 5),
    closing_time: ((r.closing_time as string) || '22:00').slice(0, 5),
    is_active: (r.is_active as boolean) ?? true,
    cover_image: (r.cover_image_url as string) || (r.cover_image as string) || undefined,
    cover_image_url: (r.cover_image_url as string) || null,
    images: (r.images || []) as FieldImage[],
    amenities: (r.amenities || []) as Amenity[],
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    location_url: (r.location_url as string) || null,
    phone: (r.phone as string) || '',
    advance_booking_days: (r.advance_booking_days as number) ?? 1,
    subscription_valid: r.subscription_valid as boolean,
  };
}

export const fieldsApi = {
  getAll: async (): Promise<Field[]> => {
    const data = await apiFetch<PaginatedResponse<unknown>>(`${API_BASE_URL}/admin/fields/`);
    return (data.results || []).map((item) => normalizeField(item as Record<string, unknown>));
  },

  getById: async (id: number): Promise<Field> => {
    const data = await apiFetch<unknown>(`${API_BASE_URL}/admin/fields/${id}/`);
    return normalizeField(data as Record<string, unknown>);
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
      location_url: data.location_url || null,
      phone: data.phone || '',
      advance_booking_days: data.advance_booking_days ?? 1,
    };
    const res = await apiFetch<unknown>(`${API_BASE_URL}/admin/fields/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return normalizeField(res as Record<string, unknown>);
  },

  update: async (id: number, data: Partial<Field> | FormData): Promise<Field> => {
    let options: RequestInit;
    
    if (data instanceof FormData) {
      options = {
        method: 'PATCH',
        body: data,
      };
    } else {
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.description !== undefined) payload.description = data.description;
      if (data.address !== undefined) payload.address = data.address;
      if (data.city !== undefined) payload.city = data.city;
      if (data.price_per_hour !== undefined) payload.price_per_hour = Number(data.price_per_hour);
      if (data.opening_time !== undefined) payload.opening_time = data.opening_time.includes(':') && data.opening_time.split(':').length === 2 ? `${data.opening_time}:00` : data.opening_time;
      if (data.closing_time !== undefined) payload.closing_time = data.closing_time.includes(':') && data.closing_time.split(':').length === 2 ? `${data.closing_time}:00` : data.closing_time;
      if (data.is_active !== undefined) payload.is_active = data.is_active;
      if (data.location_url !== undefined) payload.location_url = data.location_url;
      if (data.phone !== undefined) payload.phone = data.phone;
      if (data.advance_booking_days !== undefined) payload.advance_booking_days = data.advance_booking_days;

      options = {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      };
    }

    const res = await apiFetch<unknown>(`${API_BASE_URL}/admin/fields/${id}/`, options);
    return normalizeField(res as Record<string, unknown>);
  },

  toggleActive: async (id: number): Promise<Field> => {
    const current = await fieldsApi.getById(id);
    return fieldsApi.update(id, { is_active: !current.is_active });
  },

  delete: async (id: number): Promise<void> => {
    await apiFetch<unknown>(`${API_BASE_URL}/admin/fields/${id}/`, {
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
    await apiFetch<unknown>(`${API_BASE_URL}/admin/fields/${fieldId}/images/${imageId}/`, {
      method: 'DELETE',
    });
  },

  reorderImages: async (fieldId: number, order: number[]): Promise<void> => {
    await apiFetch<unknown>(`${API_BASE_URL}/admin/fields/${fieldId}/images/reorder/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });
  },

  // Amenities
  addAmenity: async (fieldId: number, data: Partial<Amenity>): Promise<Amenity> => {
    const res = await apiFetch<unknown>(`${API_BASE_URL}/admin/fields/${fieldId}/amenities/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const r = res as Record<string, unknown>;
    return { id: r.id as number, icon: (r.icon as string) || '⚽', name: (r.name as string) || '' };
  },

  deleteAmenity: async (fieldId: number, amenityId: number): Promise<void> => {
    await apiFetch<unknown>(`${API_BASE_URL}/admin/fields/${fieldId}/amenities/${amenityId}/`, {
      method: 'DELETE',
    });
  },

  getSlots: async (fieldId: number, date: string): Promise<Slot[]> => {
    return apiFetch<Slot[]>(`${API_BASE_URL}/admin/fields/${fieldId}/slots/?date=${date}`);
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
function normalizeProfile(raw: Record<string, unknown>): AdminProfile {
  const r = raw as Record<string, string | number | boolean | null | undefined>;
  return {
    id: r.id as number,
    username: (r.username as string) || '',
    first_name: (r.first_name as string) || '',
    last_name: (r.last_name as string) || '',
    phone: (r.phone as string) || (r.phone_number as string) || undefined,
    role: (r.role as string) || undefined,
    avatar_url: (r.avatar_url as string) || null,
    date_joined: r.date_joined as string,
    name: `${(r.first_name as string) || ''} ${(r.last_name as string) || ''}`.trim() || (r.username as string) || '',
    email: (r.email as string) || (r.username as string) || '',
    avatar: (r.avatar_url as string) || undefined,
    email_notifications: (r.email_notifications as boolean) ?? true,
  };
}

export const settingsApi = {
  getProfile: async (): Promise<AdminProfile> => {
    const data = await apiFetch<unknown>(`${API_BASE_URL}/auth/me/`);
    return normalizeProfile(data as Record<string, unknown>);
  },

  updateProfile: async (data: Partial<AdminProfile>): Promise<AdminProfile> => {
    const payload: Record<string, unknown> = {};
    if (data.first_name !== undefined) payload.first_name = data.first_name;
    if (data.last_name !== undefined) payload.last_name = data.last_name;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.email !== undefined) payload.email = data.email;
    if (data.email_notifications !== undefined) payload.email_notifications = data.email_notifications;

    const res = await apiFetch<unknown>(`${API_BASE_URL}/auth/me/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return normalizeProfile(res as Record<string, unknown>);
  },

  changePassword: async (old_password: string, new_password: string): Promise<void> => {
    await apiFetch<unknown>(`${API_BASE_URL}/auth/password/change/`, {
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
    const sub = data.subscription as unknown as { keys?: { p256dh?: string; auth?: string } };
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

  unsubscribe: async (endpoint: string): Promise<void> => {
    await delay(200);
    // Mock: no-op
    void endpoint; // Mark as intentionally unused
  },

  sendTestNotification: async (payload: PushTestRequest): Promise<PushTestResponse> => {
    await delay(300);
    void payload; // Mark as intentionally unused
    return { success: true, message: 'Test bildirishnoma yuborildi' };
  },

  getSubscriptions: async (): Promise<PushSubscriptionResponse[]> => {
    await delay(200);
    return [];
  },
};
