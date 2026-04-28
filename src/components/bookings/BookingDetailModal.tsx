import { useState } from 'react';
import { User, MapPin, Clock, CheckCircle, XCircle, Ban, Printer } from 'lucide-react';
import BottomSheet from '../shared/BottomSheet';
import StatusBadge from '../shared/StatusBadge';
import LoadingSpinner from '../shared/LoadingSpinner';
import type { Booking } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils';
import { bookingsApi } from '../../api';
import { useToast } from '../../context/ToastContext';

interface Props {
  booking: Booking;
  onClose: () => void;
  onUpdate: () => void;
}

export default function BookingDetailModal({ booking, onClose, onUpdate }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const { showToast } = useToast();

  const handleConfirm = async () => {
    setLoading('confirm');
    try {
      await bookingsApi.confirm(booking.id);
      showToast('Bron tasdiqlandi!', 'success');
      onUpdate(); onClose();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Xatolik', 'error');
    } finally { setLoading(null); }
  };

  const handleReject = async () => {
    setLoading('reject');
    try {
      await bookingsApi.reject(booking.id, rejectReason.trim() || undefined);
      showToast('Bron rad etildi', 'info');
      onUpdate(); onClose();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Xatolik', 'error');
    } finally { setLoading(null); }
  };

  const handleCancel = async () => {
    setLoading('cancel');
    try {
      await bookingsApi.cancel(booking.id);
      showToast('Bron bekor qilindi', 'info');
      onUpdate(); onClose();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Xatolik', 'error');
    } finally { setLoading(null); }
  };

  return (
    <BottomSheet isOpen={true} onClose={onClose} title={`Bron #${booking.id}`}>
      <div className="space-y-4">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <StatusBadge status={booking.status} />
          <span className="text-xs text-gray-400">{formatDateTime(booking.created_at)}</span>
        </div>

        {/* Client Info */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center">
              <User size={14} className="text-blue-500" />
            </div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Mijoz</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">Ism</p>
              <p className="text-sm font-semibold text-gray-800">{booking.client_name}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">Telefon</p>
              <a href={`tel:${booking.client_phone}`} className="text-sm font-semibold text-emerald-600">
                {booking.client_phone}
              </a>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] text-gray-400 mb-0.5">Bron turi</p>
              <p className="text-sm font-medium text-gray-700">{booking.booking_type_display}</p>
            </div>
          </div>
        </div>

        {/* Field */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center">
              <MapPin size={14} className="text-emerald-500" />
            </div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Maydon</p>
          </div>
          <p className="text-sm font-semibold text-gray-800">{booking.field_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{booking.field_city}</p>
        </div>

        {/* Booking details */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center">
              <Clock size={14} className="text-purple-500" />
            </div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Bron ma'lumotlari</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">Sana</p>
              <p className="text-sm font-semibold text-gray-800">{formatDate(booking.date)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">Vaqt</p>
              <p className="text-sm font-semibold text-gray-800">
                {booking.start_time.slice(0, 5)}–{booking.end_time.slice(0, 5)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">Holat</p>
              <p className="text-sm font-medium text-gray-700">{booking.status_display}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">Narx</p>
              <p className="text-sm font-bold text-emerald-500">{formatCurrency(Number(booking.total_price))}</p>
            </div>
            {booking.confirmed_at && (
              <div className="col-span-2">
                <p className="text-[10px] text-gray-400 mb-0.5">Tasdiqlangan vaqt</p>
                <p className="text-sm text-gray-700">{formatDateTime(booking.confirmed_at)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        {booking.note && (
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-600 mb-1">Izoh</p>
            <p className="text-sm text-blue-700">{booking.note}</p>
          </div>
        )}

        {/* Reject reason input */}
        {showRejectInput && (
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Rad etish sababi</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Sababni kiriting..."
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm resize-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
            />
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {booking.status === 'pending' && (
            <>
              <button
                onClick={handleConfirm}
                disabled={!!loading}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-emerald-200"
              >
                {loading === 'confirm' ? <LoadingSpinner size={16} /> : <CheckCircle size={16} />}
                Tasdiqlash
              </button>
              {!showRejectInput ? (
                <button
                  onClick={() => setShowRejectInput(true)}
                  className="w-full py-3.5 rounded-2xl bg-red-50 text-red-500 font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <XCircle size={16} /> Rad etish
                </button>
              ) : (
                <button
                  onClick={handleReject}
                  disabled={!!loading}
                  className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading === 'reject' ? <LoadingSpinner size={16} /> : <XCircle size={16} />}
                  Rad etishni tasdiqlash
                </button>
              )}
            </>
          )}
          {booking.status === 'confirmed' && (
            <button
              onClick={handleCancel}
              disabled={!!loading}
              className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading === 'cancel' ? <LoadingSpinner size={16} /> : <Ban size={16} />}
              Bekor qilish
            </button>
          )}
          <button
            onClick={() => {
              const w = window.open('', '_blank');
              if (w) {
                w.document.write(`<html><body><pre>${JSON.stringify(booking, null, 2)}</pre></body></html>`);
                w.print();
              }
            }}
            className="w-full py-3 rounded-2xl border border-gray-200 text-gray-500 font-medium text-sm flex items-center justify-center gap-2"
          >
            <Printer size={15} /> Kvitansiya
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
