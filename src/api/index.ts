import type {
  DashboardStats,
  Booking,
  BookingFilters,
  Field,
  Notification,
  AdminProfile,
  PaginatedResponse,
  Amenity,
} from '../types';
import {
  mockAdmin,
  mockFields as _mockFields,
  mockBookings as _mockBookings,
  mockNotifications as _mockNotifications,
  mockDashboardStats,
} from './mockData';

// ─── In-memory store ──────────────────────────────────────────────────────────
let fields: Field[] = JSON.parse(JSON.stringify(_mockFields));
let bookings: Booking[] = JSON.parse(JSON.stringify(_mockBookings));
let notifications: Notification[] = JSON.parse(JSON.stringify(_mockNotifications));
let adminProfile: AdminProfile = { ...mockAdmin };
let nextFieldId = 100;
let nextBookingId = 200;
let nextAmenityId = 500;
let nextImageId = 600;
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

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string) => {
    await delay(500);
    // Accept any credentials for mock — or restrict to specific ones
    if (!email || !password) throw new Error('Email va parolni kiriting');
    localStorage.setItem('admin_token', 'mock_token_123');
    return { access: 'mock_token_123', refresh: 'mock_refresh_123', admin: adminProfile };
  },
  logout: async () => {
    await delay(200);
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
export const fieldsApi = {
  getAll: async (): Promise<Field[]> => {
    await delay(300);
    return fields.map((f) => ({ ...f }));
  },

  getById: async (id: number): Promise<Field> => {
    await delay(200);
    const f = fields.find((f) => f.id === id);
    if (!f) throw new Error('Maydon topilmadi');
    return { ...f };
  },

  create: async (data: Partial<Field>): Promise<Field> => {
    await delay(400);
    const newField: Field = {
      id: nextFieldId++,
      name: data.name || 'Yangi maydon',
      description: data.description || '',
      address: data.address || '',
      city: data.city || 'Toshkent',
      price_per_hour: data.price_per_hour || 0,
      opening_time: data.opening_time || '08:00',
      closing_time: data.closing_time || '22:00',
      is_active: data.is_active ?? true,
      images: [],
      amenities: [],
      created_at: new Date().toISOString(),
    };
    fields.push(newField);
    return { ...newField };
  },

  update: async (id: number, data: Partial<Field>): Promise<Field> => {
    await delay(350);
    const idx = fields.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Maydon topilmadi');
    fields[idx] = { ...fields[idx], ...data };
    return { ...fields[idx] };
  },

  toggleActive: async (id: number): Promise<Field> => {
    await delay(250);
    const idx = fields.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Maydon topilmadi');
    fields[idx] = { ...fields[idx], is_active: !fields[idx].is_active };
    return { ...fields[idx] };
  },

  delete: async (id: number): Promise<void> => {
    await delay(300);
    fields = fields.filter((f) => f.id !== id);
  },

  // Images
  uploadImage: async (fieldId: number, formData: FormData): Promise<{ id: number; image: string; order: number }> => {
    await delay(600);
    const file = formData.get('image') as File;
    const url = file ? URL.createObjectURL(file) : 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80';
    const idx = fields.findIndex((f) => f.id === fieldId);
    if (idx === -1) throw new Error('Maydon topilmadi');
    const newImg = { id: nextImageId++, image: url, order: (fields[idx].images?.length || 0) + 1 };
    fields[idx].images = [...(fields[idx].images || []), newImg];
    return newImg;
  },

  deleteImage: async (fieldId: number, imageId: number): Promise<void> => {
    await delay(250);
    const idx = fields.findIndex((f) => f.id === fieldId);
    if (idx === -1) throw new Error('Maydon topilmadi');
    fields[idx].images = (fields[idx].images || []).filter((img) => img.id !== imageId);
  },

  reorderImages: async (fieldId: number, order: number[]): Promise<void> => {
    await delay(200);
    const idx = fields.findIndex((f) => f.id === fieldId);
    if (idx === -1) return;
    const imgs = fields[idx].images || [];
    fields[idx].images = order.map((id, i) => {
      const img = imgs.find((img) => img.id === id);
      return img ? { ...img, order: i + 1 } : img!;
    }).filter(Boolean);
  },

  // Amenities
  addAmenity: async (fieldId: number, data: Partial<Amenity>): Promise<Amenity> => {
    await delay(300);
    const idx = fields.findIndex((f) => f.id === fieldId);
    if (idx === -1) throw new Error('Maydon topilmadi');
    const newAmenity: Amenity = { id: nextAmenityId++, icon: data.icon || '⚽', name: data.name || '' };
    fields[idx].amenities = [...(fields[idx].amenities || []), newAmenity];
    return newAmenity;
  },

  deleteAmenity: async (fieldId: number, amenityId: number): Promise<void> => {
    await delay(250);
    const idx = fields.findIndex((f) => f.id === fieldId);
    if (idx === -1) throw new Error('Maydon topilmadi');
    fields[idx].amenities = (fields[idx].amenities || []).filter((a) => a.id !== amenityId);
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
export const settingsApi = {
  getProfile: async (): Promise<AdminProfile> => {
    await delay(200);
    return { ...adminProfile };
  },

  updateProfile: async (data: Partial<AdminProfile>): Promise<AdminProfile> => {
    await delay(350);
    adminProfile = { ...adminProfile, ...data };
    return { ...adminProfile };
  },

  changePassword: async (old_password: string, _new_password: string): Promise<void> => {
    await delay(400);
    if (!old_password) throw new Error('Joriy parolni kiriting');
    // Mock: accept any old password
  },
};
