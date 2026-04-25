import { useState, useEffect } from 'react';
import { User, Lock } from 'lucide-react';
import { settingsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../shared/LoadingSpinner';

export default function ProfileTab() {
  const { admin, refreshAdmin } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState({ name: '', email: '', email_notifications: true });
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm: '' });
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    if (admin) {
      setProfile({
        name: admin.name || '',
        email: admin.email || '',
        email_notifications: admin.email_notifications ?? true,
      });
    }
  }, [admin]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) { showToast('Ism kiriting', 'warning'); return; }
    setProfileLoading(true);
    try {
      await settingsApi.updateProfile({ name: profile.name, email_notifications: profile.email_notifications });
      await refreshAdmin();
      showToast('Profil yangilandi!', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.old_password || !passwords.new_password) {
      showToast('Barcha maydonlarni to\'ldiring', 'warning'); return;
    }
    if (passwords.new_password !== passwords.confirm) {
      showToast('Yangi parollar mos kelmadi', 'warning'); return;
    }
    if (passwords.new_password.length < 6) {
      showToast('Parol kamida 6 ta belgi bo\'lishi kerak', 'warning'); return;
    }
    setPassLoading(true);
    try {
      await settingsApi.changePassword(passwords.old_password, passwords.new_password);
      showToast('Parol muvaffaqiyatli o\'zgartirildi!', 'success');
      setPasswords({ old_password: '', new_password: '', confirm: '' });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-lg">
      {/* Profile info */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-orange-500" />
          <h3 className="font-semibold text-gray-800">Shaxsiy ma'lumotlar</h3>
        </div>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ism</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setProfile((p) => ({ ...p, email_notifications: !p.email_notifications }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                profile.email_notifications ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                profile.email_notifications ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
            <span className="text-sm text-gray-600">Email bildirishnomalar</span>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm shadow-orange-200"
            >
              {profileLoading && <LoadingSpinner size={15} />}
              Saqlash
            </button>
          </div>
        </form>
      </div>

      <hr className="border-gray-100" />

      {/* Change password */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lock size={18} className="text-orange-500" />
          <h3 className="font-semibold text-gray-800">Parolni o'zgartirish</h3>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Joriy parol</label>
            <input
              type="password"
              value={passwords.old_password}
              onChange={(e) => setPasswords((p) => ({ ...p, old_password: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Yangi parol</label>
            <input
              type="password"
              value={passwords.new_password}
              onChange={(e) => setPasswords((p) => ({ ...p, new_password: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Yangi parolni tasdiqlang</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 ${
                passwords.confirm && passwords.confirm !== passwords.new_password
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
                  : 'border-gray-200 focus:border-orange-400 focus:ring-orange-400'
              }`}
              autoComplete="new-password"
            />
            {passwords.confirm && passwords.confirm !== passwords.new_password && (
              <p className="text-xs text-red-500 mt-1">Parollar mos kelmadi</p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {passLoading && <LoadingSpinner size={15} />}
              Parolni o'zgartirish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
