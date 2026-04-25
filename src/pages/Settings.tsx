import { useState, useEffect, useCallback } from 'react';
import { Settings2, Image, Star, MapPin, Bell, Plus, Trash2 } from 'lucide-react';
import { fieldsApi } from '../api';
import type { Field } from '../types';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import FieldSettingsTab from '../components/settings/FieldSettingsTab';
import ImagesTab from '../components/settings/ImagesTab';
import AmenitiesTab from '../components/settings/AmenitiesTab';
import { useToast } from '../context/ToastContext';
import { PushPermissionButton, NotificationStatusBadge } from '../components/shared/PushPermissionButton';

const TABS = [
  { id: 'field', label: "Ma'lumotlar", icon: Settings2 },
  { id: 'images', label: 'Rasmlar', icon: Image },
  { id: 'amenities', label: 'Qulayliklar', icon: Star },
  { id: 'notifications', label: 'Bildirishnomalar', icon: Bell },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('field');
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fieldsApi.getAll();
      const list = Array.isArray(data) ? data : [];
      setFields(list);
      if (list.length > 0 && !selectedFieldId) setSelectedFieldId(list[0].id);
      if (list.length > 0 && selectedFieldId && !list.find((f) => f.id === selectedFieldId)) {
        setSelectedFieldId(list[0].id);
      }
      if (list.length === 0) setSelectedFieldId(null);
    } catch {
      showToast('Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, selectedFieldId]);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsaved]);

  const handleTabChange = (tab: string) => {
    if (hasUnsaved) {
      if (!window.confirm('Saqlanmagan o\'zgarishlar bor. Davom etasizmi?')) return;
    }
    setHasUnsaved(false);
    setActiveTab(tab);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const newField = await fieldsApi.create({ name: 'Yangi maydon' });
      showToast('Yangi maydon yaratildi!', 'success');
      setFields((prev) => [...prev, newField]);
      setSelectedFieldId(newField.id);
      setActiveTab('field');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Yaratishda xatolik', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu maydonni o\'chirishni xohlaysizmi?')) return;
    setDeletingId(id);
    try {
      await fieldsApi.delete(id);
      showToast('Maydon o\'chirildi', 'success');
      await load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'O\'chirishda xatolik', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Sozlamalar</h1>
          <p className="text-xs text-gray-400">Maydon sozlamalari</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold active:bg-emerald-600 disabled:opacity-60 transition-colors shadow-sm"
        >
          {creating ? <LoadingSpinner size={14} /> : <Plus size={14} />}
          Yangi
        </button>
      </div>

      {/* Field selector */}
      <div className="px-4 mb-4">
        <div className="card p-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-emerald-500" />
            <p className="text-xs font-semibold text-gray-600">Maydon tanlash</p>
          </div>
          {loading ? (
            <LoadingSpinner size={20} className="text-emerald-500" />
          ) : fields.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm text-gray-400">Maydonlar mavjud emas</p>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold active:bg-emerald-600 disabled:opacity-60"
              >
                {creating ? <LoadingSpinner size={14} /> : <Plus size={14} />}
                Maydon yaratish
              </button>
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar items-center">
              {fields.map((f) => (
                <div key={f.id} className="relative group shrink-0">
                  <button
                    onClick={() => setSelectedFieldId(f.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      selectedFieldId === f.id
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {f.name}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }}
                    disabled={deletingId === f.id}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    {deletingId === f.id ? <LoadingSpinner size={10} /> : <Trash2 size={10} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="card p-1 flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === id ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4">
        <div className="card p-4">
          {activeTab === 'field' && (
            <FieldSettingsTab field={selectedField} onSaved={load} onDirty={setHasUnsaved} />
          )}
          {activeTab === 'images' && selectedField && (
            <ImagesTab field={selectedField} onUpdated={load} />
          )}
          {activeTab === 'amenities' && selectedField && (
            <AmenitiesTab field={selectedField} onUpdated={load} />
          )}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Push-bildirishnomalar</h2>
                <p className="text-sm text-gray-500 mt-1">Brauzer orqali to'liq PWA bildirishnomalari</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div>
                  <p className="text-sm font-medium text-emerald-900">Bildirishnomalar holati</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    {selectedField ? 'Admin panelida yangi bronlar haqida xabar' : 'Maydon tanlang'}
                  </p>
                </div>
                <NotificationStatusBadge />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Obuna bo'lish</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Push-bildirishnomalarni yoqish
                  </p>
                </div>
                <PushPermissionButton variant="primary" size="sm" />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Push-bildirishnomalar orqali siz yangi bronlar, ularning holati o'zgarishi va boshqa muhim voqealar haqida darhol xabar olasiz. Bildirishnomalar brauzer yopiq bo'lgan holatda ham keladi.
                </p>
              </div>
            </div>
          )}
          {(activeTab === 'images' || activeTab === 'amenities') && !selectedField && !loading && (
            <div className="text-center py-10 text-gray-400 text-sm">Maydon tanlanmagan</div>
          )}
        </div>
      </div>
    </div>
  );
}
