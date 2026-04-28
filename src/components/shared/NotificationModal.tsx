import { X, Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDateTime } from '../../utils';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: Props) {
  const { notifications, markAllRead, markRead } = useNotifications();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      await markRead(notification.id);
    }
    if (notification.booking) {
      onClose();
      navigate(`/bookings?id=${notification.booking}`);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 mt-20 bg-white rounded-3xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Bell size={20} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Bildirishnomalar</h2>
              <p className="text-xs text-gray-400">
                {notifications.filter(n => !n.is_read).length} ta o'qilmagan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.is_read) && (
              <button
                onClick={handleMarkAllRead}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                title="Barchasini o'qilgan qilish"
              >
                <CheckCheck size={18} className="text-gray-600" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Bell size={48} className="opacity-20 mb-3" />
              <p className="text-sm">Bildirishnomalar yo'q</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm mb-1 ${!notification.is_read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>
                      
                      {notification.booking_info && (
                        <div className="flex items-center gap-2 mb-2">
                          <StatusBadge status={notification.booking_info.status as any} />
                          <span className="text-xs text-gray-400">
                            {notification.booking_info.date} • {notification.booking_info.start_time.slice(0, 5)}
                          </span>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-400">
                        {formatDateTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
