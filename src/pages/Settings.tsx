import { useState, useEffect, useCallback } from 'react';
import { Settings2, Image, Star, MapPin, Bell } from 'lucide-react';
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
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fieldsApi.getAll();
      const list = Array.isArray(data) ? data : [];
      setFields(list);
      if (list.length > 0 && !selectedFieldId) setSelectedFieldId(list[0].id);
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

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-gray-800">Sozlamalar</h1>
        <p className="text-xs text-gray-400">Maydon sozlamalari</p>
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
            <p className="text-sm text-gray-400">Maydonlar mavjud emas</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {fields.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFieldId(f.id)}
                  className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    selectedFieldId === f.id
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {f.name}
                </button>
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
