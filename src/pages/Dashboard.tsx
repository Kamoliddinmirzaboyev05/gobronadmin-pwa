import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, Wallet, CheckCircle, XCircle, MapPin, TrendingUp, ChevronRight, Plus, Download } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Filler, Tooltip,
} from 'chart.js';
import { dashboardApi, bookingsApi } from '../api';
import type { DashboardStats, Booking } from '../types';
import { formatCurrency, formatDate } from '../utils';
import StatusBadge from '../components/shared/StatusBadge';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import BookingDetailModal from '../components/bookings/BookingDetailModal';
import ManualBookingModal from '../components/bookings/ManualBookingModal';
import NotificationModal from '../components/shared/NotificationModal';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const { admin } = useAuth();
  const { unreadCount } = useNotifications();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // iOS qurilmasini tekshirish
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Ilova allaqachon o'rnatilganligini tekshirish
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('[PWA] BeforeInstallPromptEvent fired');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      showToast('Ilova muvaffaqiyatli o\'rnatildi!', 'success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [showToast]);

  const handleInstallClick = async () => {
    if (isInstalled) {
      showToast('Ilova allaqachon o\'rnatilgan', 'info');
      return;
    }

    if (isIOS) {
      showToast('iOS uchun: Safari menyusidan "Ekraningizga qo\'shish" (Add to Home Screen) tugmasini bosing', 'info');
      return;
    }

    if (!deferredPrompt) {
      // Agar prompt yo'q bo'lsa, lekin foydalanuvchi bosgan bo'lsa, demak brauzer hali ruxsat bermagan
      showToast('O\'rnatish imkoniyati mavjud emas. Sahifani yangilang yoki brauzer sozlamalarini tekshiring.', 'warning');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] User response: ${outcome}`);
      
      if (outcome === 'accepted') {
        showToast('O\'rnatish boshlandi...', 'success');
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('[PWA] Error during installation:', err);
      showToast('O\'rnatishda xatolik yuz berdi', 'error');
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });

  const load = useCallback(async () => {
    try {
      const [statsData, bookingsData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentBookings(10),
      ]);
      setStats(statsData);
      setRecentBookings(bookingsData.results);
    } catch {
      showToast('Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleConfirm = async (bookingId: number) => {
    setActionLoading(bookingId);
    try {
      await bookingsApi.confirm(bookingId);
      showToast('Bron tasdiqlandi!', 'success');
      load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Xatolik', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bookingId: number) => {
    setActionLoading(bookingId);
    try {
      await bookingsApi.reject(bookingId);
      showToast('Bron rad etildi', 'info');
      load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Xatolik', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmRate = stats
    ? stats.by_status.confirmed + stats.by_status.pending > 0
      ? Math.round((stats.by_status.confirmed / (stats.by_status.confirmed + stats.by_status.pending + stats.by_status.rejected + stats.by_status.cancelled)) * 100)
      : 0
    : 0;

  const cancelRate = stats
    ? Math.round(((stats.by_status.cancelled + stats.by_status.rejected) / Math.max(stats.month.bookings, 1)) * 100)
    : 0;

  const lineData = {
    labels: stats?.per_day_last_30?.slice(-14).map((d) => {
      const dt = new Date(d.date);
      return `${dt.getDate()}`;
    }) || [],
    datasets: [{
      data: stats?.per_day_last_30?.slice(-14).map((d) => d.bookings) || [],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.08)',
      borderWidth: 2,
      pointRadius: 0,
      fill: true,
      tension: 0.4,
    }],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: { display: false },
      y: { display: false, beginAtZero: true },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size={36} className="text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-200">
            {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm leading-tight">{admin?.name || 'Admin'}</p>
            <p className="text-xs text-gray-400">Bugun, {dateStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* PWA yuklab olish tugmasi (iOS yoki Androidda o'rnatish mumkin bo'lganda chiqadi) */}
          {!isInstalled && (deferredPrompt || isIOS) && (
            <button
              onClick={handleInstallClick}
              className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm transition-all animate-bounce active:scale-95 border border-emerald-100"
              title="Ilovani o'rnatish"
            >
              <Download size={18} strokeWidth={2.5} />
            </button>
          )}
          <button
            onClick={() => setIsNotificationModalOpen(true)}
            className="relative w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          >
            <Bell size={18} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </div>
      <div className="px-4 space-y-4">
        {/* Top 2 big stat cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="w-10 h-10 rounded-2xl icon-bg-blue flex items-center justify-center mb-3">
              <CalendarDays size={20} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats?.today.bookings ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Bugungi bandliklar</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-xs text-emerald-500 font-medium">Bugun</span>
            </div>
          </div>
          <div className="card p-4">
            <div className="w-10 h-10 rounded-2xl icon-bg-yellow flex items-center justify-center mb-3">
              <Wallet size={20} className="text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {((stats?.month.revenue ?? 0) / 1000000).toFixed(1)}mln
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Oylik tushum (so'm)</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-xs text-emerald-500 font-medium">Bu oy</span>
            </div>
          </div>
        </div>

        {/* 3 small stat cards */}
        <div className="card p-4">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="flex flex-col items-center gap-1 pr-4">
              <div className="w-8 h-8 rounded-xl icon-bg-teal flex items-center justify-center">
                <CheckCircle size={16} className="text-emerald-500" />
              </div>
              <p className="text-lg font-bold text-gray-800">{confirmRate}%</p>
              <p className="text-[10px] text-gray-400 text-center">Tasdiqlash</p>
            </div>
            <div className="flex flex-col items-center gap-1 px-4">
              <div className="w-8 h-8 rounded-xl icon-bg-red flex items-center justify-center">
                <XCircle size={16} className="text-red-400" />
              </div>
              <p className="text-lg font-bold text-gray-800">{cancelRate}%</p>
              <p className="text-[10px] text-gray-400 text-center">Bekor</p>
            </div>
            <div className="flex flex-col items-center gap-1 pl-4">
              <div className="w-8 h-8 rounded-xl icon-bg-purple flex items-center justify-center">
                <MapPin size={16} className="text-purple-500" />
              </div>
              <p className="text-lg font-bold text-gray-800">{stats?.month.bookings ?? 0}</p>
              <p className="text-[10px] text-gray-400 text-center">Bu oy</p>
            </div>
          </div>
        </div>

        {/* Recent bookings - So'rovlar */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <p className="font-semibold text-gray-800 text-sm">So'rovlar</p>
            <button
              onClick={() => navigate('/bookings?status=pending')}
              className="flex items-center gap-1 text-xs text-emerald-500 font-semibold"
            >
              Hammasi <ChevronRight size={14} />
            </button>
          </div>

          {(!recentBookings || recentBookings.length === 0) ? (
            <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <CalendarDays size={24} className="text-gray-300" />
              </div>
              <p className="text-sm">So'rovlar yo'q</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentBookings.slice(0, 5).map((b) => (
                <div
                  key={b.id}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-sm font-bold text-white">
                        {b.client_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{b.client_name}</p>
                          <p className="text-xs text-gray-500 truncate">{b.field_name}</p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <span>{formatDate(b.date)}</span>
                        <span>•</span>
                        <span>{b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-600">{formatCurrency(Number(b.total_price))}</span>
                      </div>
                      
                      {/* Action buttons for pending bookings */}
                      {b.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirm(b.id)}
                            disabled={actionLoading === b.id}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60 active:scale-95 transition-all"
                          >
                            {actionLoading === b.id ? (
                              <LoadingSpinner size={12} />
                            ) : (
                              <>
                                <CheckCircle size={12} />
                                Tasdiqlash
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(b.id)}
                            disabled={actionLoading === b.id}
                            className="flex-1 py-2 px-3 rounded-xl bg-red-50 text-red-500 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60 active:scale-95 transition-all"
                          >
                            {actionLoading === b.id ? (
                              <LoadingSpinner size={12} />
                            ) : (
                              <>
                                <XCircle size={12} />
                                Rad etish
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      
                      {/* View details button for non-pending */}
                      {b.status !== 'pending' && (
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="text-xs text-emerald-500 font-medium hover:underline"
                        >
                          Batafsil ko'rish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Haftalik bandliklar</p>
              <p className="text-xs text-gray-400">So'nggi 14 kun</p>
            </div>
            <button
              onClick={() => navigate('/bookings')}
              className="flex items-center gap-1 text-xs text-emerald-500 font-semibold"
            >
              Batafsil <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ height: 100 }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Status summary */}
        <div className="card p-4">
          <p className="font-semibold text-gray-800 text-sm mb-3">Holat bo'yicha</p>
          <div className="space-y-2.5">
            {[
              { label: 'Kutilmoqda', count: stats?.by_status.pending ?? 0, color: 'bg-yellow-400', pct: stats ? Math.round((stats.by_status.pending / Math.max(stats.month.bookings, 1)) * 100) : 0 },
              { label: 'Tasdiqlangan', count: stats?.by_status.confirmed ?? 0, color: 'bg-emerald-400', pct: stats ? Math.round((stats.by_status.confirmed / Math.max(stats.month.bookings, 1)) * 100) : 0 },
              { label: 'Rad etilgan', count: stats?.by_status.rejected ?? 0, color: 'bg-red-400', pct: stats ? Math.round((stats.by_status.rejected / Math.max(stats.month.bookings, 1)) * 100) : 0 },
              { label: 'Bekor qilingan', count: stats?.by_status.cancelled ?? 0, color: 'bg-gray-300', pct: stats ? Math.round((stats.by_status.cancelled / Math.max(stats.month.bookings, 1)) * 100) : 0 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <p className="text-xs text-gray-500 w-28 shrink-0">{item.label}</p>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                </div>
                <p className="text-xs font-semibold text-gray-700 w-6 text-right">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdate={load}
        />
      )}

      <ManualBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={load}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      {/* Floating Action Button */}
      <button
        onClick={() => setIsBookingModalOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 active:scale-95 transition-all z-40"
      >
        <Plus size={32} strokeWidth={2.5} />
      </button>
    </div>
  );
}
