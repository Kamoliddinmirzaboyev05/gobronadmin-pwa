import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, X, Download, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { bookingsApi, fieldsApi } from '../api';
import type { Booking, Field, BookingFilters } from '../types';
import { formatCurrency, formatDate, downloadBlob } from '../utils';
import StatusBadge from '../components/shared/StatusBadge';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import BookingDetailModal from '../components/bookings/BookingDetailModal';
import ManualBookingModal from '../components/bookings/ManualBookingModal';
import { useToast } from '../context/ToastContext';
import { useSearchParams } from 'react-router-dom';

const STATUS_OPTIONS = [
  { value: '', label: 'Barchasi' },
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'confirmed', label: 'Tasdiqlangan' },
  { value: 'rejected', label: 'Rad etilgan' },
  { value: 'cancelled', label: 'Bekor' },
];

const STATUS_COLORS: Record<string, string> = {
  '': 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState<BookingFilters>({
    status: '', date_from: '', date_to: '', field_id: '', search: '', page: 1, ordering: '-created_at',
  });

  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookingsApi.getAll(filters);
      setBookings(data.results);
      setTotal(data.count);
    } catch {
      showToast('Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fieldsApi.getAll().then(setFields).catch(() => {}); }, []);
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) bookingsApi.getById(Number(id)).then(setSelectedBooking).catch(() => {});
  }, [searchParams]);

  const set = (key: keyof BookingFilters, value: string | number) =>
    setFilters((p) => ({ ...p, [key]: value, page: 1 }));

  const reset = () =>
    setFilters({ status: '', date_from: '', date_to: '', field_id: '', search: '', page: 1, ordering: '-created_at' });

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await bookingsApi.exportCsv();
      const blob = await res.blob();
      downloadBlob(blob, `bandliklar-${new Date().toISOString().slice(0, 10)}.csv`);
      showToast('CSV yuklab olindi', 'success');
    } catch {
      showToast('Export xatoligi', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveFilters = !!(filters.status || filters.date_from || filters.date_to || filters.field_id);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Bandliklar</h1>
            <p className="text-xs text-gray-400">Jami {total} ta</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center"
          >
            {exportLoading ? <LoadingSpinner size={16} className="text-emerald-500" /> : <Download size={18} className="text-gray-600" />}
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ism yoki telefon..."
              value={filters.search}
              onChange={(e) => set('search', e.target.value)}
              className="w-full pl-9 pr-3 py-3 rounded-2xl bg-white border-0 shadow-sm text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm relative ${showFilters || hasActiveFilters ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600'}`}
          >
            <SlidersHorizontal size={18} />
            {hasActiveFilters && !showFilters && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="px-4 mb-3">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => set('status', o.value)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filters.status === o.value
                  ? STATUS_COLORS[o.value] + ' ring-2 ring-offset-1 ring-current'
                  : 'bg-white text-gray-500 shadow-sm'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="mx-4 mb-3 card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Dan</label>
              <input type="date" value={filters.date_from} onChange={(e) => set('date_from', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Gacha</label>
              <input type="date" value={filters.date_to} onChange={(e) => set('date_to', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm" />
            </div>
          </div>
          <select value={filters.field_id} onChange={(e) => set('field_id', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm">
            <option value="">Barcha maydonlar</option>
            {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button onClick={reset} className="flex items-center gap-2 text-sm text-red-500 font-medium">
            <X size={14} /> Filtrlarni tozalash
          </button>
        </div>
      )}

      {/* List */}
      <div className="px-4 space-y-2.5">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size={32} className="text-emerald-500" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="card py-14 flex flex-col items-center gap-2 text-gray-400">
            <Search size={32} className="opacity-30" />
            <p className="text-sm">Bandliklar topilmadi</p>
          </div>
        ) : (
          bookings.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBooking(b)}
              className="card w-full p-4 flex items-center gap-3.5 text-left active:scale-[0.98] transition-transform hover:shadow-md"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-lg font-bold text-white">
                  {b.client_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate mb-0.5">{b.client_name}</p>
                <p className="text-xs text-gray-500 truncate mb-1">{b.field_name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{formatDate(b.date)}</span>
                  <span>•</span>
                  <span>{b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={b.status} />
                <p className="text-sm font-bold text-emerald-600">{formatCurrency(Number(b.total_price))}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 px-4">
          <button
            onClick={() => set('page', (filters.page || 1) - 1)}
            disabled={(filters.page || 1) <= 1}
            className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center disabled:opacity-40"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <span className="text-sm text-gray-600 font-medium">
            {filters.page || 1} / {totalPages}
          </span>
          <button
            onClick={() => set('page', (filters.page || 1) + 1)}
            disabled={(filters.page || 1) >= totalPages}
            className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center disabled:opacity-40"
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsManualBookingOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-emerald-500 shadow-xl shadow-emerald-300 flex items-center justify-center z-40 active:scale-95 transition-transform"
      >
        <Plus size={24} className="text-white" />
      </button>

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdate={load}
        />
      )}

      <ManualBookingModal
        isOpen={isManualBookingOpen}
        onClose={() => setIsManualBookingOpen(false)}
        onSuccess={load}
      />
    </div>
  );
}
