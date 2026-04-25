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
    if (!rejectReason.trim()) { showToast('Sababni kiriting', 'warning'); return; }
    setLoading('reject');
    try {
      await bookingsApi.reject(booking.id, rejectReason);
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

        {/* User */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center">
              <User size={14} className="text-blue-500" />
            </div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Foydalanuvchi</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">Ism</p>
              <p className="text-sm font-semibold text-gray-800">{booking.user?.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">Telefon</p>
              <a href={`tel:${booking.user?.phone}`} className="text-sm font-semibold text-emerald-600">
                {booking.user?.phone}
              </a>
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
          <p className="text-sm font-semibold text-gray-800">{booking.field?.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{booking.field?.city} • {booking.field?.address}</p>
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
              <p className="text-sm font-semibold text-gray-800">{booking.start_time}–{booking.end_time}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">Davomiylik</p>
              <p className="text-sm font-semibold text-gray-800">{booking.duration} soat</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">Narx</p>
              <p className="text-sm font-bold text-emerald-500">{formatCurrency(booking.total_price)}</p>
            </div>
          </div>
        </div>

        {/* Note */}
        {booking.note && (
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-600 mb-1">Izoh</p>
            <p className="text-sm text-blue-700">{booking.note}</p>
          </div>
        )}

        {/* Reject reason */}
        {booking.reject_reason && (
          <div className="bg-red-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-red-600 mb-1">Rad etish sababi</p>
            <p className="text-sm text-red-700">{booking.reject_reason}</p>
          </div>
        )}

        {/* Status history */}
        {booking.status_history && booking.status_history.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Holat tarixi</p>
            <div className="space-y-2">
              {booking.status_history.map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700 font-medium">{h.status}
                      {h.changed_by && <span className="text-gray-400 font-normal"> — {h.changed_by}</span>}
                    </p>
                    <p className="text-xs text-gray-400">{formatDateTime(h.changed_at)}</p>
                  </div>
                </div>
              ))}
            </div>
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
