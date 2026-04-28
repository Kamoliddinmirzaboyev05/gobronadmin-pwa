import { useState, useEffect, useCallback } from 'react';
import { Calendar, User, Phone, CheckCircle2, Clock, MapPin, CreditCard, StickyNote } from 'lucide-react';
import { fieldsApi, bookingsApi } from '../../api';
import type { Field, Slot, ManualBookingRequest } from '../../types';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../shared/LoadingSpinner';
import BottomSheet from '../shared/BottomSheet';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualBookingModal({ isOpen, onClose, onSuccess }: Props) {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [guestFullName, setGuestFullName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [plan, setPlan] = useState<string>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadFields();
    }
  }, [isOpen]);

  const loadFields = async () => {
    try {
      const data = await fieldsApi.getAll();
      setFields(data);
      if (data.length > 0 && !selectedField) setSelectedField(data[0].id);
    } catch (err) {
      showToast('Maydonlarni yuklashda xatolik', 'error');
    }
  };

  const loadSlots = useCallback(async () => {
    if (!selectedField || !date) return;
    setSlotsLoading(true);
    try {
      const data = await fieldsApi.getSlots(selectedField, date);
      setSlots(data);
      setSelectedSlots([]);
    } catch (err) {
      showToast('Slotlarni yuklashda xatolik', 'error');
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedField, date, showToast]);

  useEffect(() => {
    if (isOpen && selectedField && date) {
      loadSlots();
    }
  }, [isOpen, selectedField, date, loadSlots]);

  const toggleSlot = (slotId: number) => {
    setSelectedSlots(prev => 
      prev.includes(slotId) 
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedField) { showToast('Maydonni tanlang', 'warning'); return; }
    if (selectedSlots.length === 0) { showToast('Kamida bitta slotni tanlang', 'warning'); return; }
    if (!guestFullName.trim()) { showToast('Ismni kiriting', 'warning'); return; }
    if (!guestPhone.trim()) { showToast('Telefon raqamini kiriting', 'warning'); return; }

    setLoading(true);
    try {
      const payload: ManualBookingRequest = {
        field_id: selectedField,
        date,
        slot_ids: selectedSlots, // Backend might support multiple
        slot_id: selectedSlots[0], // Mandatory based on Swagger
        guest_full_name: guestFullName,
        guest_phone: guestPhone,
        plan: plan ? Number(plan) : undefined,
        note: note.trim() || undefined
      };

      await bookingsApi.createManual(payload);
      showToast('Muvaffaqiyatli band qilindi', 'success');
      onSuccess();
      onClose();
      // Reset form
      setGuestFullName('');
      setGuestPhone('');
      setPlan('');
      setNote('');
      setSelectedSlots([]);
    } catch (err: any) {
      showToast(err.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Yangi bandlik">
      <form onSubmit={handleSubmit} className="space-y-6 pb-6">
        {/* Field Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
            <MapPin size={14} className="text-emerald-500" /> Maydonni tanlang
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {fields.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedField(f.id)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap border transition-all ${
                  selectedField === f.id
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-100'
                    : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Date Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar size={14} className="text-emerald-500" /> Sanani tanlang
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
            />
          </div>

          {/* Plan/Price */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <CreditCard size={14} className="text-emerald-500" /> To'lov (ixtiyoriy)
            </label>
            <input
              type="number"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="0 = tekin"
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
            />
          </div>
        </div>

        {/* Slots Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
            <Clock size={14} className="text-emerald-500" /> Vaqtni tanlang
          </label>
          {slotsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size={24} className="text-emerald-500" />
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-400">Bu kunga bo'sh vaqtlar yo'q</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {slots
                .filter(s => {
                  const now = new Date();
                  const slotTime = new Date(`${date}T${s.start_time}`);
                  return slotTime >= now;
                })
                .map(s => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={s.is_booked || !s.is_active}
                    onClick={() => toggleSlot(s.id)}
                    className={`relative py-3 px-2 rounded-2xl text-xs font-bold transition-all border ${
                      s.is_booked || !s.is_active
                        ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                        : selectedSlots.includes(s.id)
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-500 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-100 hover:border-emerald-200'
                    }`}
                  >
                    {s.start_time.slice(0, 5)}
                    {selectedSlots.includes(s.id) && (
                      <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
                        <CheckCircle2 size={10} />
                      </div>
                    )}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                <User size={14} className="text-emerald-500" /> Mijoz ismi
              </label>
              <input
                type="text"
                value={guestFullName}
                onChange={(e) => setGuestFullName(e.target.value)}
                placeholder="Alisher Valiyev"
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                <Phone size={14} className="text-emerald-500" /> Telefon raqami
              </label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <StickyNote size={14} className="text-emerald-500" /> Izoh (ixtiyoriy)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Qo'shimcha ma'lumotlar..."
              rows={2}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? <LoadingSpinner size={18} /> : <CheckCircle2 size={18} />}
            Band qilishni saqlash
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
