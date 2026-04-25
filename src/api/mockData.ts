import type { Field, Booking, Notification, AdminProfile, DashboardStats } from '../types';

export const mockAdmin: AdminProfile = {
  id: 1,
  name: 'Jasur Toshmatov',
  email: 'admin@gobron.uz',
  email_notifications: true,
};

export const mockFields: Field[] = [
  {
    id: 1,
    name: 'GoBron Arena 1',
    description: 'Zamonaviy sun\'iy o\'t qoplamali futbol maydoni. Kechasi ham o\'ynash mumkin.',
    address: 'Chilonzor tumani, 9-kvartal',
    city: 'Toshkent',
    price_per_hour: 150000,
    opening_time: '08:00',
    closing_time: '23:00',
    is_active: true,
    cover_image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80',
    images: [
      { id: 1, image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80', order: 1 },
      { id: 2, image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&q=80', order: 2 },
    ],
    amenities: [
      { id: 1, icon: '🚿', name: 'Dush xonasi' },
      { id: 2, icon: '🅿️', name: 'Parking' },
      { id: 3, icon: '💡', name: 'Yoritish' },
      { id: 4, icon: '🔐', name: 'Kiyinish xonasi' },
    ],
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    name: 'Sport Palace Mini',
    description: 'Yopiq sport zali. Yomg\'ir va qor ta\'sir qilmaydi.',
    address: 'Yunusobod tumani, 19-mavze',
    city: 'Toshkent',
    price_per_hour: 200000,
    opening_time: '07:00',
    closing_time: '22:00',
    is_active: true,
    cover_image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&q=80',
    images: [
      { id: 3, image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&q=80', order: 1 },
    ],
    amenities: [
      { id: 5, icon: '☕', name: 'Kafe' },
      { id: 6, icon: '🚿', name: 'Dush xonasi' },
      { id: 7, icon: '📹', name: 'Videokuzatuv' },
    ],
    created_at: '2024-02-10T09:00:00Z',
  },
  {
    id: 3,
    name: 'Green Field Samarqand',
    description: 'Samarqand shahrining eng yaxshi futbol maydoni.',
    address: 'Registon ko\'chasi, 45',
    city: 'Samarqand',
    price_per_hour: 100000,
    opening_time: '09:00',
    closing_time: '21:00',
    is_active: false,
    cover_image: 'https://images.unsplash.com/photo-1551958219-acbc595d9e47?w=600&q=80',
    images: [],
    amenities: [
      { id: 8, icon: '🅿️', name: 'Parking' },
      { id: 9, icon: '💡', name: 'Yoritish' },
    ],
    created_at: '2024-03-05T11:00:00Z',
  },
];

const mockUsers = [
  { id: 1, name: 'Bobur Aliyev', phone: '+998901234567', email: 'bobur@mail.uz' },
  { id: 2, name: 'Sardor Rahimov', phone: '+998912345678', email: 'sardor@mail.uz' },
  { id: 3, name: 'Dilnoza Yusupova', phone: '+998923456789', email: 'dilnoza@mail.uz' },
  { id: 4, name: 'Jasur Karimov', phone: '+998934567890', email: 'jasur@mail.uz' },
  { id: 5, name: 'Malika Tosheva', phone: '+998945678901', email: 'malika@mail.uz' },
  { id: 6, name: 'Ulugbek Nazarov', phone: '+998956789012', email: 'ulugbek@mail.uz' },
  { id: 7, name: 'Feruza Xolmatova', phone: '+998967890123', email: 'feruza@mail.uz' },
  { id: 8, name: 'Sherzod Mirzayev', phone: '+998978901234', email: 'sherzod@mail.uz' },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function createdAt(daysAgoN: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgoN);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const mockBookings: Booking[] = [
  {
    id: 1, user: mockUsers[0], field: mockFields[0],
    date: daysAgo(0), start_time: '10:00', end_time: '11:00', duration: 1,
    total_price: 150000, status: 'pending', note: 'Iltimos vaqtida tayyor bo\'lsin',
    created_at: createdAt(0, 9),
    status_history: [{ status: 'pending', changed_at: createdAt(0, 9) }],
  },
  {
    id: 2, user: mockUsers[1], field: mockFields[0],
    date: daysAgo(0), start_time: '12:00', end_time: '14:00', duration: 2,
    total_price: 300000, status: 'confirmed',
    created_at: createdAt(0, 8),
    status_history: [
      { status: 'pending', changed_at: createdAt(0, 8) },
      { status: 'confirmed', changed_at: createdAt(0, 8), changed_by: 'Admin' },
    ],
  },
  {
    id: 3, user: mockUsers[2], field: mockFields[1],
    date: daysAgo(1), start_time: '15:00', end_time: '16:00', duration: 1,
    total_price: 200000, status: 'confirmed',
    created_at: createdAt(1, 14),
    status_history: [
      { status: 'pending', changed_at: createdAt(1, 14) },
      { status: 'confirmed', changed_at: createdAt(1, 15), changed_by: 'Admin' },
    ],
  },
  {
    id: 4, user: mockUsers[3], field: mockFields[0],
    date: daysAgo(1), start_time: '18:00', end_time: '20:00', duration: 2,
    total_price: 300000, status: 'pending',
    created_at: createdAt(1, 17),
    status_history: [{ status: 'pending', changed_at: createdAt(1, 17) }],
  },
  {
    id: 5, user: mockUsers[4], field: mockFields[2],
    date: daysAgo(2), start_time: '09:00', end_time: '10:00', duration: 1,
    total_price: 100000, status: 'rejected', reject_reason: 'Maydon ta\'mirda',
    created_at: createdAt(2, 8),
    status_history: [
      { status: 'pending', changed_at: createdAt(2, 8) },
      { status: 'rejected', changed_at: createdAt(2, 9), changed_by: 'Admin', note: 'Maydon ta\'mirda' },
    ],
  },
  {
    id: 6, user: mockUsers[5], field: mockFields[1],
    date: daysAgo(2), start_time: '20:00', end_time: '22:00', duration: 2,
    total_price: 400000, status: 'confirmed',
    created_at: createdAt(2, 19),
    status_history: [
      { status: 'pending', changed_at: createdAt(2, 19) },
      { status: 'confirmed', changed_at: createdAt(2, 19), changed_by: 'Admin' },
    ],
  },
  {
    id: 7, user: mockUsers[6], field: mockFields[0],
    date: daysAgo(3), start_time: '14:00', end_time: '15:00', duration: 1,
    total_price: 150000, status: 'cancelled',
    created_at: createdAt(3, 13),
    status_history: [
      { status: 'pending', changed_at: createdAt(3, 13) },
      { status: 'cancelled', changed_at: createdAt(3, 14) },
    ],
  },
  {
    id: 8, user: mockUsers[7], field: mockFields[0],
    date: daysAgo(3), start_time: '16:00', end_time: '18:00', duration: 2,
    total_price: 300000, status: 'confirmed',
    created_at: createdAt(3, 15),
    status_history: [
      { status: 'pending', changed_at: createdAt(3, 15) },
      { status: 'confirmed', changed_at: createdAt(3, 16), changed_by: 'Admin' },
    ],
  },
  {
    id: 9, user: mockUsers[0], field: mockFields[1],
    date: daysAgo(4), start_time: '10:00', end_time: '12:00', duration: 2,
    total_price: 400000, status: 'confirmed',
    created_at: createdAt(4, 9),
    status_history: [
      { status: 'pending', changed_at: createdAt(4, 9) },
      { status: 'confirmed', changed_at: createdAt(4, 10), changed_by: 'Admin' },
    ],
  },
  {
    id: 10, user: mockUsers[1], field: mockFields[2],
    date: daysAgo(5), start_time: '11:00', end_time: '12:00', duration: 1,
    total_price: 100000, status: 'pending', note: 'Kechikmaslik kerak',
    created_at: createdAt(5, 10),
    status_history: [{ status: 'pending', changed_at: createdAt(5, 10) }],
  },
  {
    id: 11, user: mockUsers[2], field: mockFields[0],
    date: daysAgo(6), start_time: '19:00', end_time: '21:00', duration: 2,
    total_price: 300000, status: 'confirmed',
    created_at: createdAt(6, 18),
    status_history: [
      { status: 'pending', changed_at: createdAt(6, 18) },
      { status: 'confirmed', changed_at: createdAt(6, 18), changed_by: 'Admin' },
    ],
  },
  {
    id: 12, user: mockUsers[3], field: mockFields[1],
    date: daysAgo(7), start_time: '08:00', end_time: '09:00', duration: 1,
    total_price: 200000, status: 'confirmed',
    created_at: createdAt(7, 7),
    status_history: [
      { status: 'pending', changed_at: createdAt(7, 7) },
      { status: 'confirmed', changed_at: createdAt(7, 8), changed_by: 'Admin' },
    ],
  },
  {
    id: 13, user: mockUsers[4], field: mockFields[0],
    date: daysAgo(8), start_time: '13:00', end_time: '15:00', duration: 2,
    total_price: 300000, status: 'rejected', reject_reason: 'To\'lov amalga oshirilmadi',
    created_at: createdAt(8, 12),
    status_history: [
      { status: 'pending', changed_at: createdAt(8, 12) },
      { status: 'rejected', changed_at: createdAt(8, 13), changed_by: 'Admin' },
    ],
  },
  {
    id: 14, user: mockUsers[5], field: mockFields[2],
    date: daysAgo(9), start_time: '17:00', end_time: '18:00', duration: 1,
    total_price: 100000, status: 'confirmed',
    created_at: createdAt(9, 16),
    status_history: [
      { status: 'pending', changed_at: createdAt(9, 16) },
      { status: 'confirmed', changed_at: createdAt(9, 17), changed_by: 'Admin' },
    ],
  },
  {
    id: 15, user: mockUsers[6], field: mockFields[1],
    date: daysAgo(10), start_time: '21:00', end_time: '22:00', duration: 1,
    total_price: 200000, status: 'cancelled',
    created_at: createdAt(10, 20),
    status_history: [
      { status: 'pending', changed_at: createdAt(10, 20) },
      { status: 'cancelled', changed_at: createdAt(10, 21) },
    ],
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 1, message: 'Bobur Aliyev yangi bron qildi — GoBron Arena 1, bugun 10:00',
    booking_id: 1, is_read: false, created_at: createdAt(0, 9),
  },
  {
    id: 2, message: 'Jasur Karimov yangi bron qildi — GoBron Arena 1, kecha 18:00',
    booking_id: 4, is_read: false, created_at: createdAt(1, 17),
  },
  {
    id: 3, message: 'Malika Tosheva bronni bekor qildi — Green Field Samarqand',
    booking_id: 5, is_read: false, created_at: createdAt(2, 9),
  },
  {
    id: 4, message: 'Sardor Rahimov yangi bron qildi — Green Field Samarqand',
    booking_id: 10, is_read: true, created_at: createdAt(5, 10),
  },
  {
    id: 5, message: 'Feruza Xolmatova bronni bekor qildi — Sport Palace Mini',
    booking_id: 15, is_read: true, created_at: createdAt(10, 21),
  },
];

// Generate bookings_per_day for last 30 days
function generateBookingsPerDay() {
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const count = Math.floor(Math.random() * 8) + 1;
    result.push({ date: dateStr, count });
  }
  return result;
}

export const mockDashboardStats: DashboardStats = {
  today_bookings: 2,
  today_bookings_trend: 15,
  weekly_bookings: 11,
  weekly_bookings_trend: 8,
  monthly_bookings: 15,
  monthly_bookings_trend: 22,
  monthly_revenue: 3300000,
  monthly_revenue_trend: 18,
  bookings_per_day: generateBookingsPerDay(),
  bookings_by_status: {
    pending: 3,
    confirmed: 9,
    rejected: 2,
    cancelled: 2,
  },
  recent_bookings: mockBookings.slice(0, 10),
};
