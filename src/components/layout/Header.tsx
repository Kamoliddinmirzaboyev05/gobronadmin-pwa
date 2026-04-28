import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, ChevronDown, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { timeAgo } from '../../utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

interface Props {
  title: string;
  onMenuClick: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Header({ title, onMenuClick }: Props) {
  const { admin, logout } = useAuth();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const notifsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('[PWA] BeforeInstallPromptEvent fired');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    document.addEventListener('mousedown', handler);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      document.removeEventListener('mousedown', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      showToast('Ilova allaqachon o\'rnatilgan yoki brauzer PWA ni qo\'llab-quvvatlamaydi', 'info');
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to the install prompt: ${outcome}`);
    
    setDeferredPrompt(null);
  };

  const handleNotifClick = async (notif: typeof notifications[0]) => {
    await markRead(notif.id);
    setShowNotifs(false);
    if (notif.booking) {
      navigate(`/bookings?id=${notif.booking}`);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      </div>

      {/* Right: notifications + profile */}
      <div className="flex items-center gap-2">
        {/* PWA Install Button */}
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2"
            title="Ilovani o'rnatish"
          >
            <Download size={20} />
            <span className="hidden sm:inline text-xs font-medium">O'rnatish</span>
          </button>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifsRef}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">Bildirishnomalar</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                  >
                    Barchasini o'qildi
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    Bildirishnomalar yo'q
                  </div>
                ) : (
                  notifications.slice(0, 15).map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                        !notif.is_read ? 'bg-orange-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                        )}
                        <div className={!notif.is_read ? '' : 'pl-4'}>
                          <p className="text-sm text-gray-700 leading-snug">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-sm">
              {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              {admin?.name || 'Admin'}
            </span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1">
              <button
                onClick={() => { navigate('/settings'); setShowProfile(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Sozlamalar
              </button>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                Chiqish
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
