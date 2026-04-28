import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, MapPin, ToggleLeft, ToggleRight, Copy } from 'lucide-react';
import { fieldsApi } from '../api';
import type { Field } from '../types';
import { formatCurrency } from '../utils';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import BottomSheet from '../components/shared/BottomSheet';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import FieldForm from '../components/fields/FieldForm';
import { useToast } from '../context/ToastContext';

export default function Fields() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editField, setEditField] = useState<Field | null>(null);
  const [duplicateField, setDuplicateField] = useState<Field | null>(null);
  const [deleteField, setDeleteField] = useState<Field | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fieldsApi.getAll();
      setFields(Array.isArray(data) ? data : []);
    } catch {
      showToast('Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (field: Field) => {
    try {
      const updated = await fieldsApi.toggleActive(field.id);
      setFields((p) => p.map((f) => f.id === field.id ? updated : f));
      showToast(updated.is_active ? 'Faollashtirildi' : 'Nofaol qilindi', 'success');
    } catch {
      showToast('Xatolik', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteField) return;
    setDeleteLoading(true);
    try {
      await fieldsApi.delete(deleteField.id);
      setFields((p) => p.filter((f) => f.id !== deleteField.id));
      showToast('Maydon o\'chirildi', 'success');
      setDeleteField(null);
    } catch {
      showToast('Xatolik', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDuplicate = (field: Field) => {
    setDuplicateField(field);
    setEditField(null);
    setShowForm(true);
    showToast('Ma\'lumotlar ko\'chirildi. Narx va rasmlarni o\'zgartiring', 'info');
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Maydonlar</h1>
          <p className="text-xs text-gray-400">Jami {fields.length} ta</p>
        </div>
        <button
          onClick={() => { setEditField(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 text-white text-sm font-semibold shadow-md shadow-emerald-200 active:scale-95 transition-transform"
        >
          <Plus size={16} />
          Qo'shish
        </button>
      </div>

      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size={32} className="text-emerald-500" />
          </div>
        ) : fields.length === 0 ? (
          <div className="card py-14 flex flex-col items-center gap-3 text-gray-400">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center">
              <MapPin size={28} className="text-gray-300" />
            </div>
            <p className="text-sm">Hali maydonlar yo'q</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-white text-sm font-semibold"
            >
              Birinchi maydonni qo'shish
            </button>
          </div>
        ) : (
          fields.map((field) => (
            <div key={field.id} className="card overflow-hidden">
              {/* Cover */}
              <div className="h-36 bg-linear-to-br from-slate-100 to-slate-200 relative">
                {field.cover_image ? (
                  <img src={field.cover_image} alt={field.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin size={36} className="text-slate-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${field.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {field.is_active ? 'Faol' : 'Nofaol'}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-gray-800 mb-1">{field.name}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                  <MapPin size={11} />
                  <span>{field.city} • {field.address}</span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400">Narx</p>
                    <p className="font-bold text-emerald-500 text-sm">{formatCurrency(field.price_per_hour)}/soat</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Ish vaqti</p>
                    <p className="text-sm font-semibold text-gray-700">{field.opening_time}–{field.closing_time}</p>
                  </div>
                </div>

                {/* Amenities */}
                {field.amenities && field.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {field.amenities.slice(0, 4).map((a) => (
                      <span key={a.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {a.icon} {a.name}
                      </span>
                    ))}
                    {field.amenities.length > 4 && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{field.amenities.length - 4}</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => { setEditField(field); setDuplicateField(null); setShowForm(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold active:bg-gray-50"
                  >
                    <Edit2 size={13} /> Tahrirlash
                  </button>
                  <button
                    onClick={() => handleDuplicate(field)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-blue-200 text-blue-600 text-xs font-semibold active:bg-blue-50"
                  >
                    <Copy size={13} /> Nusxa
                  </button>
                  <button
                    onClick={() => handleToggle(field)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-semibold ${
                      field.is_active ? 'border border-orange-200 text-orange-500' : 'border border-emerald-200 text-emerald-600'
                    }`}
                  >
                    {field.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                  <button
                    onClick={() => setDeleteField(field)}
                    className="w-10 h-10 rounded-xl border border-red-100 text-red-400 flex items-center justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Field Form BottomSheet */}
      <BottomSheet
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditField(null); setDuplicateField(null); }}
        title={editField ? 'Maydonni tahrirlash' : duplicateField ? 'Nusxa yaratish' : 'Yangi maydon'}
      >
        <FieldForm
          field={editField}
          duplicateFrom={duplicateField}
          onSaved={() => { setShowForm(false); setEditField(null); setDuplicateField(null); load(); }}
          onCancel={() => { setShowForm(false); setEditField(null); setDuplicateField(null); }}
        />
      </BottomSheet>

      <ConfirmDialog
        isOpen={!!deleteField}
        onClose={() => setDeleteField(null)}
        onConfirm={handleDelete}
        title="Maydonni o'chirish"
        message={`"${deleteField?.name}" ni o'chirishni tasdiqlaysizmi?`}
        confirmLabel="O'chirish"
        loading={deleteLoading}
      />
    </div>
  );
}
