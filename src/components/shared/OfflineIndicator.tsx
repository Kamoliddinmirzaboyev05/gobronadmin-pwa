import { WifiOff, Wifi } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { useEffect, useState } from 'react';

export default function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [show, setShow] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Online bo'lganda 3 soniya ko'rsatib, keyin yashirish
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!show) return null;

  return (
    <div
      className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium transition-all ${
        isOnline
          ? 'bg-emerald-500 text-white'
          : 'bg-gray-800 text-white'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi size={16} />
          <span>Internetga ulandi</span>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span>Internet yo'q - Offline rejim</span>
        </>
      )}
    </div>
  );
}
