export interface User {
  id: number;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
}

export interface Field {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  price_per_hour: number | string;
  opening_time: string;
  closing_time: string;
  is_active: boolean;
  cover_image?: string;
  cover_image_url?: string | null;
  images?: FieldImage[];
  amenities?: Amenity[];
  created_at: string;
  updated_at?: string;
  location_url?: string | null;
  phone?: string;
  advance_booking_days?: number;
  subscription_valid?: boolean;
}

export interface FieldImage {
  id: number;
  image: string;
  order: number;
}

export interface Amenity {
  id: number;
  icon: string;
  name: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';

export interface Booking {
  id: number;
  user: User;
  field: Field;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  total_price: number;
  status: BookingStatus;
  note?: string;
  reject_reason?: string;
  created_at: string;
  status_history?: StatusHistory[];
}

export interface StatusHistory {
  status: BookingStatus;
  changed_at: string;
  changed_by?: string;
  note?: string;
}

export interface DashboardStats {
  today_bookings: number;
  today_bookings_trend: number;
  weekly_bookings: number;
  weekly_bookings_trend: number;
  monthly_bookings: number;
  monthly_bookings_trend: number;
  monthly_revenue: number;
  monthly_revenue_trend: number;
  bookings_per_day: { date: string; count: number }[];
  bookings_by_status: {
    pending: number;
    confirmed: number;
    rejected: number;
    cancelled: number;
  };
  recent_bookings: Booking[];
}

export interface Notification {
  id: number;
  message: string;
  booking_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface AdminProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: string;
  avatar_url?: string | null;
  date_joined?: string;
  /** UI compatibility — computed from first_name + last_name */
  name: string;
  /** UI compatibility — falls back to username if email missing */
  email: string;
  avatar?: string;
  email_notifications?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BookingFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
  field_id?: string;
  search?: string;
  page?: number;
  ordering?: string;
}

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

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface RegisterRequest {
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  password: string;
  password2: string;
}

export interface RegisterResponse {
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    phone: string;
    role: string;
    avatar_url: string | null;
    date_joined: string;
  };
  refresh: string;
  access: string;
}
