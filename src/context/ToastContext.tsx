import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ToastMessage } from '../types';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastContextType {
  showToast: (message: string, type?: ToastMessage['type']) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons = {
    success: <CheckCircle size={18} className="text-green-500" />,
    error: <XCircle size={18} className="text-red-500" />,
    warning: <AlertTriangle size={18} className="text-yellow-500" />,
    info: <Info size={18} className="text-blue-500" />,
  };

  const colors = {
    success: 'border-l-green-500',
    error: 'border-l-red-500',
    warning: 'border-l-yellow-500',
    info: 'border-l-blue-500',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-24 left-4 right-4 z-[9999] flex flex-col gap-2 max-w-lg mx-auto">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-enter bg-white rounded-2xl shadow-xl border-l-4 ${colors[toast.type]} p-4 flex items-start gap-3`}
          >
            {icons[toast.type]}
            <p className="text-sm text-gray-700 flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
