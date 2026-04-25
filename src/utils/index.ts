import type { BookingStatus } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return `${diff} soniya oldin`;
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`;
  return formatDate(dateStr);
}

export function getStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    pending: 'Kutilmoqda',
    confirmed: 'Tasdiqlangan',
    rejected: 'Rad etilgan',
    cancelled: 'Bekor qilingan',
  };
  return labels[status] || status;
}

export function getStatusColor(status: BookingStatus): string {
  const colors: Record<BookingStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}

export function generateTimeSlots(opening: string, closing: string): string[] {
  const slots: string[] = [];
  const [openH, openM] = opening.split(':').map(Number);
  const [closeH, closeM] = closing.split(':').map(Number);

  let current = openH * 60 + openM;
  const end = closeH * 60 + closeM;

  while (current < end) {
    const h = Math.floor(current / 60).toString().padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    const nextMin = current + 60;
    const nh = Math.floor(nextMin / 60).toString().padStart(2, '0');
    const nm = (nextMin % 60).toString().padStart(2, '0');
    if (nextMin <= end) {
      slots.push(`${h}:${m} — ${nh}:${nm}`);
    }
    current += 60;
  }
  return slots;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const CITIES = [
  'Toshkent',
  'Samarqand',
  'Buxoro',
  'Namangan',
  'Andijon',
  'Farg\'ona',
  'Nukus',
  'Qarshi',
  'Termiz',
  'Jizzax',
  'Sirdaryo',
  'Navoiy',
  'Urganch',
];

export const AMENITY_SUGGESTIONS = [
  { icon: '⚽', name: "Sun'iy o't" },
  { icon: '🚿', name: 'Dush xonasi' },
  { icon: '🅿️', name: 'Parking' },
  { icon: '☕', name: 'Kafe' },
  { icon: '💡', name: 'Yoritish' },
  { icon: '🔐', name: 'Kiyinish xonasi' },
  { icon: '🚑', name: 'Tibbiy yordam' },
  { icon: '🏪', name: "Do'kon" },
  { icon: '🚰', name: 'Ichimlik suvi' },
  { icon: '📹', name: 'Videokuzatuv' },
];
