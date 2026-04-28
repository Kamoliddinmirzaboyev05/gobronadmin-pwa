import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/shared/LoadingSpinner';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { showToast('Foydalanuvchi nomi va parolni kiriting', 'warning'); return; }
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell justify-center" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)' }}>
      <div className="px-6 w-full max-w-sm mx-auto">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500 flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/30">
            <span className="text-4xl">⚽</span>
          </div>
          <h1 className="text-2xl font-bold text-white">GoBron</h1>
          <p className="text-slate-400 text-sm mt-1">Admin Panel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Foydalanuvchi nomi</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Foydalanuvchi nomini kiriting"
              className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Parol</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold text-base transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-emerald-500/30 mt-2"
          >
            {loading ? <><LoadingSpinner size={20} /> Kirish...</> : 'Kirish'}
          </button>
        </form>

        <div className="text-center mt-8 space-y-3">
          <p className="text-slate-400 text-sm">
            Hisobingiz yo'qmi?{' '}
            <Link
              to="/register"
              className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors"
            >
              Ro'yxatdan o'tish
            </Link>
          </p>
          <p className="text-slate-600 text-xs">© 2025 GoBron</p>
        </div>
      </div>
    </div>
  );
}
