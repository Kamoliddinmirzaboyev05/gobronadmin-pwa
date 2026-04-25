import { useState } from 'react';
import type { Field } from '../../types';
import { fieldsApi } from '../../api';
import { CITIES, generateTimeSlots } from '../../utils';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../shared/LoadingSpinner';

interface Props {
  field: Field | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function FieldForm({ field, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({
    name: field?.name || '',
    description: field?.description || '',
    address: field?.address || '',
    city: field?.city || 'Toshkent',
    price_per_hour: field?.price_per_hour || 0,
    opening_time: field?.opening_time || '08:00',
    closing_time: field?.closing_time || '22:00',
    is_active: field?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const slots = generateTimeSlots(form.opening_time, form.closing_time);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast('Maydon nomini kiriting', 'warning'); return; }
    setLoading(true);
    try {
      if (field) {
        await fieldsApi.update(field.id, form);
        showToast('Maydon yangilandi!', 'success');
      } else {
        await fieldsApi.create(form);
        showToast('Yangi maydon qo\'shildi!', 'success');
      }
      onSaved();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          Maydon nomi <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Masalan: Yulduz Sport Markazi"
          className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tavsif</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          placeholder="Maydon haqida qisqacha..."
          className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm resize-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Shahar</label>
          <select
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full px-3 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm"
          >
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Narx (so'm/soat)</label>
          <input
            type="number"
            value={form.price_per_hour}
            onChange={(e) => setForm({ ...form, price_per_hour: Number(e.target.value) })}
            min={0} step={1000}
            className="w-full px-3 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Manzil</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Ko'cha, uy raqami..."
          className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ochilish</label>
          <input type="time" value={form.opening_time}
            onChange={(e) => setForm({ ...form, opening_time: e.target.value })}
            className="w-full px-3 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Yopilish</label>
          <input type="time" value={form.closing_time}
            onChange={(e) => setForm({ ...form, closing_time: e.target.value })}
            className="w-full px-3 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm" />
        </div>
      </div>

      <div className="flex items-center justify-between py-1">
        <div>
          <p className="text-sm font-semibold text-gray-700">Holat</p>
          <p className="text-xs text-gray-400">{form.is_active ? 'Faol' : 'Nofaol'}</p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ ...form, is_active: !form.is_active })}
          className={`relative w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div className="bg-emerald-50 rounded-2xl p-3">
        <p className="text-xs font-semibold text-emerald-700 mb-1">
          {form.opening_time}–{form.closing_time}: {slots.length} ta slot
        </p>
        <div className="flex flex-wrap gap-1">
          {slots.slice(0, 8).map((s) => (
            <span key={s} className="text-[10px] bg-white text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">{s}</span>
          ))}
          {slots.length > 8 && <span className="text-[10px] text-emerald-500">+{slots.length - 8} ta</span>}
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-emerald-200"
        >
          {loading && <LoadingSpinner size={16} />}
          {field ? 'Saqlash' : 'Qo\'shish'}
        </button>
        <button type="button" onClick={onCancel}
          className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-semibold text-sm">
          Bekor qilish
        </button>
      </div>
    </form>
  );
}
