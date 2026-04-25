import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, ArrowLeft, User, Phone, Lock, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/shared/LoadingSpinner';

interface FormErrors {
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  password?: string;
  password2?: string;
}

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'admin',
    password: '',
    password2: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { register, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.username.trim()) newErrors.username = 'Foydalanuvchi nomini kiriting';
    else if (form.username.length < 3) newErrors.username = 'Kamida 3 ta belgi';

    if (!form.first_name.trim()) newErrors.first_name = 'Ismni kiriting';

    if (!form.last_name.trim()) newErrors.last_name = 'Familiyani kiriting';

    if (!form.phone.trim()) newErrors.phone = 'Telefon raqamni kiriting';
    else if (!/^\+?[0-9\s\-]{7,}$/.test(form.phone.trim())) {
      newErrors.phone = 'To\'g\'ri telefon raqam kiriting';
    }

    if (!form.password) newErrors.password = 'Parolni kiriting';
    else if (form.password.length < 6) newErrors.password = 'Kamida 6 ta belgi';

    if (!form.password2) newErrors.password2 = 'Parolni tasdiqlang';
    else if (form.password !== form.password2) newErrors.password2 = 'Parollar mos kelmaydi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error when typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Field-level validation on blur
    const fieldErrors: FormErrors = {};
    if (name === 'username') {
      if (!form.username.trim()) fieldErrors.username = 'Foydalanuvchi nomini kiriting';
      else if (form.username.length < 3) fieldErrors.username = 'Kamida 3 ta belgi';
    }
    if (name === 'first_name' && !form.first_name.trim()) fieldErrors.first_name = 'Ismni kiriting';
    if (name === 'last_name' && !form.last_name.trim()) fieldErrors.last_name = 'Familiyani kiriting';
    if (name === 'phone') {
      if (!form.phone.trim()) fieldErrors.phone = 'Telefon raqamni kiriting';
      else if (!/^\+?[0-9\s\-]{7,}$/.test(form.phone.trim())) {
        fieldErrors.phone = 'To\'g\'ri telefon raqam kiriting';
      }
    }
    if (name === 'password') {
      if (!form.password) fieldErrors.password = 'Parolni kiriting';
      else if (form.password.length < 6) fieldErrors.password = 'Kamida 6 ta belgi';
    }
    if (name === 'password2') {
      if (!form.password2) fieldErrors.password2 = 'Parolni tasdiqlang';
      else if (form.password !== form.password2) fieldErrors.password2 = 'Parollar mos kelmaydi';
    }

    setErrors((prev) => ({ ...prev, ...fieldErrors }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      username: true,
      first_name: true,
      last_name: true,
      phone: true,
      password: true,
      password2: true,
    });

    if (!validate()) {
      showToast('Iltimos, barcha maydonlarni to\'g\'ri to\'ldiring', 'warning');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: form.username.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        role: 'admin',
        password: form.password,
        password2: form.password2,
      });
      showToast('Muvaffaqiyatli ro\'yxatdan o\'tdingiz!', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: keyof FormErrors) => {
    const base =
      'w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 border text-white placeholder-slate-500 transition-all focus:ring-2';
    if (errors[field] && touched[field]) {
      return `${base} border-red-400/50 focus:border-red-400 focus:ring-red-400/20`;
    }
    return `${base} border-white/10 focus:border-emerald-500 focus:ring-emerald-500/20`;
  };

  return (
    <div
      className="app-shell justify-center"
      style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)' }}
    >
      <div className="px-6 w-full max-w-sm mx-auto page-scroll hide-scrollbar">
        {/* Back + Logo */}
        <div className="flex flex-col items-center mb-8 pt-4">
          <Link
            to="/login"
            className="self-start flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm mb-6"
          >
            <ArrowLeft size={16} />
            Kirish sahifasiga
          </Link>

          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mb-3 shadow-xl shadow-emerald-500/30">
            <UserPlus size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Ro'yxatdan o'tish</h1>
          <p className="text-slate-400 text-sm mt-1">Yangi admin hisobini yaratish</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Foydalanuvchi nomi
            </label>
            <div className="relative">
              <User
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="soliyev"
                className={inputClass('username')}
                autoComplete="username"
                autoCapitalize="none"
              />
            </div>
            {errors.username && touched.username && (
              <p className="text-red-400 text-xs mt-1 ml-1">{errors.username}</p>
            )}
          </div>

          {/* First & Last name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Ism</label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Maqsumjon"
                className={inputClass('first_name').replace('pl-11', 'pl-4')}
                autoComplete="given-name"
              />
              {errors.first_name && touched.first_name && (
                <p className="text-red-400 text-xs mt-1 ml-1">{errors.first_name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Familiya</label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Soliyev"
                className={inputClass('last_name').replace('pl-11', 'pl-4')}
                autoComplete="family-name"
              />
              {errors.last_name && touched.last_name && (
                <p className="text-red-400 text-xs mt-1 ml-1">{errors.last_name}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Telefon raqam
            </label>
            <div className="relative">
              <Phone
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="+998887776677"
                className={inputClass('phone')}
                autoComplete="tel"
              />
            </div>
            {errors.phone && touched.phone && (
              <p className="text-red-400 text-xs mt-1 ml-1">{errors.phone}</p>
            )}
          </div>

          {/* Role - readonly admin */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Rol</label>
            <div className="relative">
              <Shield
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400"
              />
              <input
                type="text"
                value="admin"
                readOnly
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/5 text-emerald-400 font-medium cursor-default select-none"
              />
            </div>
            <p className="text-slate-500 text-xs mt-1 ml-1">Rol doim admin bo'ladi</p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Parol</label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                className={`${inputClass('password')} pr-12`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 active:text-slate-300"
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && touched.password && (
              <p className="text-red-400 text-xs mt-1 ml-1">{errors.password}</p>
            )}
          </div>

          {/* Password confirm */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Parolni tasdiqlang
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type={showPass2 ? 'text' : 'password'}
                name="password2"
                value={form.password2}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                className={`${inputClass('password2')} pr-12`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass2(!showPass2)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 active:text-slate-300"
                tabIndex={-1}
              >
                {showPass2 ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password2 && touched.password2 && (
              <p className="text-red-400 text-xs mt-1 ml-1">{errors.password2}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold text-base transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-emerald-500/30 mt-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size={20} /> Yaratilmoqda...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Ro'yxatdan o'tish
              </>
            )}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-8 mb-4">© 2025 GoBron</p>
      </div>
    </div>
  );
}
