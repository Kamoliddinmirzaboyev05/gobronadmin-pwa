import { useState, useEffect } from 'react';
import type { Field } from '../../types';
import { fieldsApi } from '../../api';
import { CITIES, generateTimeSlots } from '../../utils';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../shared/LoadingSpinner';

interface Props {
  field: Field | null;
  onSaved: () => void;
  onDirty: (dirty: boolean) => void;
}

export default function FieldSettingsTab({ field, onSaved, onDirty }: Props) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    city: 'Toshkent',
    price_per_hour: 0,
    opening_time: '08:00',
    closing_time: '22:00',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (field) {
      setForm({
        name: field.name || '',
        description: field.description || '',
        address: field.address || '',
        city: field.city || 'Toshkent',
        price_per_hour: field.price_per_hour || 0,
        opening_time: field.opening_time || '08:00',
        closing_time: field.closing_time || '22:00',
        is_active: field.is_active ?? true,
      });
      onDirty(false);
    }
  }, [field]);

  const handleChange = (key: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    onDirty(true);
  };

  const slots = generateTimeSlots(form.opening_time, form.closing_time);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!field) return;
    if (!form.name.trim()) {
      showToast('Maydon nomini kiriting', 'warning');
      return;
    }
    setLoading(true);
    try {
      await fieldsApi.update(field.id, form);
      showToast('Sozlamalar saqlandi!', 'success');
      onDirty(false);
      onSaved();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!field) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Maydon tanlanmagan</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Maydon nomi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tavsif</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Shahar</label>
          <select
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 bg-white"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Manzil</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Narx (so'm/soat)
          </label>
          <div className="relative">
            <input
              type="number"
              value={form.price_per_hour}
              onChange={(e) => handleChange('price_per_hour', Number(e.target.value))}
              min={0}
              step={1000}
              className="w-full px-3 py-2.5 pr-16 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">so'm</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Holat</label>
          <div className="flex items-center gap-3 py-2.5">
            <button
              type="button"
              onClick={() => handleChange('is_active', !form.is_active)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                form.is_active ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                form.is_active ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
            <span className={`text-sm font-medium ${form.is_active ? 'text-green-600' : 'text-gray-500'}`}>
              {form.is_active ? 'Faol' : 'Nofaol'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ochilish vaqti</label>
          <input
            type="time"
            value={form.opening_time}
            onChange={(e) => handleChange('opening_time', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Yopilish vaqti</label>
          <input
            type="time"
            value={form.closing_time}
            onChange={(e) => handleChange('closing_time', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Slot preview */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-orange-700 mb-2">
          Slot ko'rinishi: {form.opening_time} — {form.closing_time}: <strong>{slots.length} ta slot</strong>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {slots.map((slot) => (
            <span key={slot} className="text-xs bg-white text-orange-600 border border-orange-200 px-2.5 py-1 rounded-full">
              {slot}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-60 shadow-sm shadow-orange-200"
        >
          {loading && <LoadingSpinner size={15} />}
          Saqlash
        </button>
      </div>
    </form>
  );
}
