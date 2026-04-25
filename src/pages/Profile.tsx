import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Bell, Lock, LogOut, ChevronRight, MapPin, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { settingsApi } from '../api';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import BottomSheet from '../components/shared/BottomSheet';

export default function Profile() {
  const { admin, logout, refreshAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showPassSheet, setShowPassSheet] = useState(false);

  // Edit profile
  const [name, setName] = useState('');
  const [emailNotif, setEmailNotif] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Change password
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    if (admin) {
      setName(admin.name || '');
      setEmailNotif(admin.email_notifications ?? true);
    }
  }, [admin]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { showToast('Ism kiriting', 'warning'); return; }
    setProfileLoading(true);
    try {
      await settingsApi.updateProfile({ name, email_notifications: emailNotif });
      await refreshAdmin();
      showToast('Profil yangilandi!', 'success');
      setShowEditSheet(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Xatolik', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePassChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPass || !newPass) { showToast('Barcha maydonlarni to\'ldiring', 'warning'); return; }
    if (newPass !== confirmPass) { showToast('Parollar mos kelmadi', 'warning'); return; }
    if (newPass.length < 6) { showToast('Parol kamida 6 ta belgi', 'warning'); return; }
    setPassLoading(true);
    try {
      await settingsApi.changePassword(oldPass, newPass);
      showToast('Parol o\'zgartirildi!', 'success');
      setOldPass(''); setNewPass(''); setConfirmPass('');
      setShowPassSheet(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Xatolik', 'error');
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    {
      icon: <MapPin size={18} className="text-emerald-500" />,
      bg: 'icon-bg-teal',
      label: 'Maydonlar',
      sub: 'Maydonlarni boshqarish',
      onClick: () => navigate('/fields'),
    },
    {
      icon: <Bell size={18} className="text-blue-500" />,
      bg: 'icon-bg-blue',
      label: 'Bildirishnomalar',
      sub: emailNotif ? 'Yoqilgan' : 'O\'chirilgan',
      onClick: () => setShowEditSheet(true),
    },
    {
      icon: <Lock size={18} className="text-purple-500" />,
      bg: 'icon-bg-purple',
      label: 'Parolni o\'zgartirish',
      sub: 'Xavfsizlik',
      onClick: () => setShowPassSheet(true),
    },
    {
      icon: <Star size={18} className="text-yellow-500" />,
      bg: 'icon-bg-yellow',
      label: 'Sozlamalar',
      sub: 'Maydon sozlamalari',
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        {/* Avatar + info */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-emerald-200">
              {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <button
              onClick={() => setShowEditSheet(true)}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shadow-md"
            >
              <Edit2 size={12} className="text-white" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-gray-800">{admin?.name || 'Admin'}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{admin?.email}</p>
          <button
            onClick={() => setShowEditSheet(true)}
            className="flex items-center gap-1.5 mt-3 text-emerald-500 text-sm font-semibold"
          >
            <Edit2 size={14} />
            Tahrirlash
          </button>
        </div>

        {/* Stats row */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} className="text-yellow-500" />
            <p className="text-xs font-semibold text-gray-600">Bepul tarif</p>
            <span className="ml-auto text-xs text-gray-400">Cheklanmagan</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '33%' }} />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">33% foydalanildi</p>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="card w-full flex items-center gap-3 p-4 active:scale-[0.98] transition-transform text-left"
          >
            <div className={`w-10 h-10 rounded-2xl ${item.bg} flex items-center justify-center shrink-0`}>
              {item.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400">{item.sub}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="card w-full flex items-center gap-3 p-4 active:scale-[0.98] transition-transform text-left"
        >
          <div className="w-10 h-10 rounded-2xl icon-bg-red flex items-center justify-center shrink-0">
            <LogOut size={18} className="text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-500">Chiqish</p>
            <p className="text-xs text-gray-400">Tizimdan chiqish</p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
      </div>

      {/* Edit Profile Sheet */}
      <BottomSheet isOpen={showEditSheet} onClose={() => setShowEditSheet(false)} title="Profilni tahrirlash">
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Ism</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Email</label>
            <input
              type="email"
              value={admin?.email || ''}
              disabled
              className="w-full px-4 py-3 rounded-2xl bg-gray-100 text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-semibold text-gray-700">Email bildirishnomalar</p>
              <p className="text-xs text-gray-400">Yangi bronlar haqida xabar</p>
            </div>
            <button
              type="button"
              onClick={() => setEmailNotif(!emailNotif)}
              className={`relative w-12 h-6 rounded-full transition-colors ${emailNotif ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emailNotif ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <button
            type="submit"
            disabled={profileLoading}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {profileLoading && <LoadingSpinner size={16} />}
            Saqlash
          </button>
        </form>
      </BottomSheet>

      {/* Change Password Sheet */}
      <BottomSheet isOpen={showPassSheet} onClose={() => setShowPassSheet(false)} title="Parolni o'zgartirish">
        <form onSubmit={handlePassChange} className="space-y-4">
          {[
            { label: 'Joriy parol', val: oldPass, set: setOldPass, ac: 'current-password' },
            { label: 'Yangi parol', val: newPass, set: setNewPass, ac: 'new-password' },
            { label: 'Yangi parolni tasdiqlang', val: confirmPass, set: setConfirmPass, ac: 'new-password' },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{f.label}</label>
              <input
                type="password"
                value={f.val}
                onChange={(e) => f.set(e.target.value)}
                autoComplete={f.ac}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
              />
            </div>
          ))}
          {confirmPass && confirmPass !== newPass && (
            <p className="text-xs text-red-500">Parollar mos kelmadi</p>
          )}
          <button
            type="submit"
            disabled={passLoading}
            className="w-full py-3.5 rounded-2xl bg-gray-800 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {passLoading && <LoadingSpinner size={16} />}
            O'zgartirish
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
