import { useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import type { Field } from '../../types';
import { fieldsApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../shared/LoadingSpinner';

interface Props {
  field: Field;
  onUpdated: () => void;
}

const PRESET_AMENITIES = [
  { icon: '🚿', name: 'Dush' },
  { icon: '🅿️', name: 'Parkovka' },
  { icon: '💡', name: 'Yoritish' },
  { icon: '👟', name: 'Kiyinish xonasi' },
  { icon: '🥤', name: 'Bufet' },
  { icon: '📷', name: 'Kamera' },
  { icon: '🌿', name: 'Sun\'iy o\'t' },
  { icon: '🏆', name: 'Tribuna' },
];

export default function AmenitiesTab({ field, onUpdated }: Props) {
  const [icon, setIcon] = useState('⚽');
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const amenities = field.amenities || [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { showToast('Qulaylik nomini kiriting', 'warning'); return; }
    setAdding(true);
    try {
      await fieldsApi.addAmenity(field.id, { icon, name: name.trim() });
      showToast('Qulaylik qo\'shildi!', 'success');
      setName('');
      onUpdated();
    } catch {
      showToast('Xatolik yuz berdi', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (amenityId: number) => {
    setDeletingId(amenityId);
    try {
      await fieldsApi.deleteAmenity(field.id, amenityId);
      showToast('Qulaylik o\'chirildi', 'success');
      onUpdated();
    } catch {
      showToast('O\'chirishda xatolik', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreset = async (preset: { icon: string; name: string }) => {
    const exists = amenities.some((a) => a.name === preset.name);
    if (exists) { showToast('Bu qulaylik allaqachon mavjud', 'warning'); return; }
    setAdding(true);
    try {
      await fieldsApi.addAmenity(field.id, preset);
      showToast('Qulaylik qo\'shildi!', 'success');
      onUpdated();
    } catch {
      showToast('Xatolik yuz berdi', 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      {/* Preset quick-add */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Tez qo'shish</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_AMENITIES.map((p) => {
            const exists = amenities.some((a) => a.name === p.name);
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => handlePreset(p)}
                disabled={exists || adding}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  exists
                    ? 'bg-green-50 border-green-200 text-green-600 cursor-default'
                    : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                {p.icon} {p.name}
                {exists && ' ✓'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom add form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="🏆"
          className="w-16 px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
          maxLength={4}
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Qulaylik nomi..."
          className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
        />
        <button
          type="submit"
          disabled={adding}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors disabled:opacity-60"
        >
          {adding ? <LoadingSpinner size={15} /> : <Plus size={15} />}
          Qo'shish
        </button>
      </form>

      {/* Amenities list */}
      {amenities.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Star size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Hali qulayliklar qo'shilmagan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {amenities.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{a.icon}</span>
                <span className="text-sm font-medium text-gray-700">{a.name}</span>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                disabled={deletingId === a.id}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
              >
                {deletingId === a.id ? <LoadingSpinner size={14} /> : <Trash2 size={14} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
