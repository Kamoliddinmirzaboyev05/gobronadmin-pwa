import { RefreshCw } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

export default function UpdatePrompt() {
  const { needsUpdate, update } = usePWA();

  if (!needsUpdate) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-linear-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-2xl shadow-2xl animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <RefreshCw size={20} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Yangi versiya mavjud!</p>
          <p className="text-xs text-emerald-50 mt-0.5">Ilovani yangilash uchun bosing</p>
        </div>
        <button
          onClick={update}
          className="px-4 py-2 bg-white text-emerald-600 rounded-xl text-sm font-semibold hover:bg-emerald-50 active:scale-95 transition-all"
        >
          Yangilash
        </button>
      </div>
    </div>
  );
}
