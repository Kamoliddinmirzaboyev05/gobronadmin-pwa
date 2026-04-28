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
    <div className="pb-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sozlamalar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Maydon sozlamalari</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold active:bg-emerald-600 disabled:opacity-60 transition-colors shadow-sm"
        >
          {creating ? <LoadingSpinner size={16} /> : <Plus size={16} />}
          Yangi
        </button>
      </div>

      {/* Field selector */}
      <div className="px-4 mb-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <MapPin size={16} className="text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Maydon tanlash</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size={24} className="text-emerald-500" />
            </div>
          ) : fields.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-sm text-gray-500">Maydonlar mavjud emas</p>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold active:bg-emerald-600 disabled:opacity-60"
              >
                {creating ? <LoadingSpinner size={16} /> : <Plus size={16} />}
                Maydon yaratish
              </button>
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar items-center pb-1">
              {fields.map((f) => (
                <div key={f.id} className="relative group shrink-0">
                  <button
                    onClick={() => setSelectedFieldId(f.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedFieldId === f.id
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {f.name}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }}
                    disabled={deletingId === f.id}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    {deletingId === f.id ? <LoadingSpinner size={12} /> : <Trash2 size={12} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-1 flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-2.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === id ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
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
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Push-bildirishnomalar</h2>
                <p className="text-sm text-gray-600 mt-1">Brauzer orqali to'liq PWA bildirishnomalari</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Bildirishnomalar holati</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    {selectedField ? 'Admin panelida yangi bronlar haqida xabar' : 'Maydon tanlang'}
                  </p>
                </div>
                <NotificationStatusBadge />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Obuna bo'lish</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Push-bildirishnomalarni yoqish
                  </p>
                </div>
                <PushPermissionButton variant="primary" size="sm" />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Push-bildirishnomalar orqali siz yangi bronlar, ularning holati o'zgarishi va boshqa muhim voqealar haqida darhol xabar olasiz. Bildirishnomalar brauzer yopiq bo'lgan holatda ham keladi.
                </p>
              </div>
            </div>
          )}
          {(activeTab === 'images' || activeTab === 'amenities') && !selectedField && !loading && (
            <div className="text-center py-12 text-gray-400 text-sm">Maydon tanlanmagan</div>
          )}
        </div>
      </div>
    </div>
  );
}
