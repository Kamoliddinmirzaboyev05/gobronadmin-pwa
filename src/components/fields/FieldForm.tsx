import { useState, useRef } from 'react';
import { Settings2, Image as ImageIcon, Star, MapPin, Upload, X } from 'lucide-react';
import type { Field } from '../../types';
import { fieldsApi } from '../../api';
import { CITIES, generateTimeSlots } from '../../utils';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../shared/LoadingSpinner';
import ImagesTab from '../settings/ImagesTab';
import AmenitiesTab from '../settings/AmenitiesTab';

interface Props {
  field: Field | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function FieldForm({ field, onSaved, onCancel }: Props) {
  const [activeTab, setActiveTab] = useState<'basic' | 'images' | 'amenities'>('basic');
  const [form, setForm] = useState({
    name: field?.name || '',
    description: field?.description || '',
    address: field?.address || '',
    city: field?.city || 'Toshkent',
    price_per_hour: field?.price_per_hour || 0,
    opening_time: field?.opening_time || '08:00',
    closing_time: field?.closing_time || '22:00',
    is_active: field?.is_active ?? true,
    phone: field?.phone || '',
    location_url: field?.location_url || '',
    advance_booking_days: field?.advance_booking_days || 1,
  });
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const slots = generateTimeSlots(form.opening_time, form.closing_time);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab !== 'basic') return;
    if (!form.name.trim()) { showToast('Maydon nomini kiriting', 'warning'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        price_per_hour: Number(form.price_per_hour),
        advance_booking_days: Number(form.advance_booking_days),
      };
      if (field) {
        await fieldsApi.update(field.id, payload);
        showToast('Maydon yangilandi!', 'success');
      } else {
        await fieldsApi.create(payload);
        showToast('Yangi maydon qo\'shildi!', 'success');
      }
      onSaved();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !field) return;

    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('cover_image', file);
      await fieldsApi.update(field.id, fd);
      
      showToast('Muqova rasmi yangilandi!', 'success');
      onSaved();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Xatolik', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const renderBasicTab = () => (
    <div className="space-y-4">
      {/* Cover Image Section (only for existing fields) */}
      {field && (
        <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-gray-100 group border border-gray-100">
          {field.cover_image ? (
            <img src={field.cover_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
              <ImageIcon size={32} />
              <span className="text-xs">Muqova rasmi yo'q</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="px-4 py-2 rounded-xl bg-white text-gray-800 text-xs font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors"
            >
              {uploadingCover ? <LoadingSpinner size={14} /> : <Upload size={14} />}
              Rasmni o'zgartirish
            </button>
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
          />
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
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
            rows={2}
            placeholder="Maydon haqida qisqacha..."
            className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm resize-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Location & Contact */}
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
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Telefon</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+998 90 123 45 67"
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

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Google Maps URL</label>
        <input
          type="url"
          value={form.location_url}
          onChange={(e) => setForm({ ...form, location_url: e.target.value })}
          placeholder="https://goo.gl/maps/..."
          className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
        />
      </div>

      {/* Pricing & Booking */}
      <div className="grid grid-cols-2 gap-3">
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
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Oldindan band qilish (kun)</label>
          <input
            type="number"
            value={form.advance_booking_days}
            onChange={(e) => setForm({ ...form, advance_booking_days: Number(e.target.value) })}
            min={1} max={30}
            className="w-full px-3 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm"
          />
        </div>
      </div>

      {/* Working Hours */}
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

      {/* Status Toggle */}
      <div className="flex items-center justify-between py-2 px-1 bg-gray-50/50 rounded-2xl">
        <div className="px-3">
          <p className="text-sm font-semibold text-gray-700">Holat</p>
          <p className="text-xs text-gray-400">{form.is_active ? 'Foydalanuvchilar ko\'ra oladi' : 'Foydalanuvchilarga ko\'rinmaydi'}</p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ ...form, is_active: !form.is_active })}
          className={`relative w-12 h-6 rounded-full transition-colors mr-3 ${form.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Slot Preview */}
      <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
        <p className="text-xs font-semibold text-emerald-700 mb-2">
          Ish vaqti: {form.opening_time}–{form.closing_time} ({slots.length} ta slot)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {slots.slice(0, 10).map((s) => (
            <span key={s} className="text-[10px] bg-white text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">{s}</span>
          ))}
          {slots.length > 10 && <span className="text-[10px] text-emerald-500 font-medium">+{slots.length - 10} yana</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Tabs - Only show when editing */}
      {field && (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'basic' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings2 size={14} /> Ma'lumotlar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'images' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ImageIcon size={14} /> Rasmlar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('amenities')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'amenities' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Star size={14} /> Qulayliklar
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {activeTab === 'basic' ? (
          <form id="field-form" onSubmit={handleSubmit}>
            {renderBasicTab()}
          </form>
        ) : activeTab === 'images' && field ? (
          <div className="pt-2">
            <ImagesTab field={field} onUpdated={onSaved} />
          </div>
        ) : activeTab === 'amenities' && field ? (
          <div className="pt-2">
            <AmenitiesTab field={field} onUpdated={onSaved} />
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-6 mt-auto sticky bottom-0 bg-white">
        {activeTab === 'basic' ? (
          <>
            <button
              form="field-form"
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all"
            >
              {loading && <LoadingSpinner size={16} />}
              {field ? 'O\'zgarishlarni saqlash' : 'Yangi maydon yaratish'}
            </button>
            <button type="button" onClick={onCancel}
              className="w-full py-4 rounded-2xl bg-gray-100 text-gray-500 font-semibold text-sm active:bg-gray-200 transition-colors">
              Bekor qilish
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className="w-full py-4 rounded-2xl bg-gray-100 text-gray-800 font-bold text-sm active:scale-[0.98] transition-all"
          >
            Asosiy ma'lumotlarga qaytish
          </button>
        )}
      </div>
    </div>
  );
}
