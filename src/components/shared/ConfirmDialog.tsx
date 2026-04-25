import BottomSheet from './BottomSheet';
import LoadingSpinner from './LoadingSpinner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmClass?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message,
  confirmLabel = 'Tasdiqlash',
  confirmClass = 'bg-red-500',
  loading = false,
}: Props) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
      <div className="space-y-2">
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`w-full py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 ${confirmClass} disabled:opacity-60`}
        >
          {loading && <LoadingSpinner size={16} />}
          {confirmLabel}
        </button>
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-semibold text-sm"
        >
          Bekor qilish
        </button>
      </div>
    </BottomSheet>
  );
}
