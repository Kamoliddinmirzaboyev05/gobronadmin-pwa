import { NavLink } from 'react-router-dom';
import { LayoutGrid, CalendarCheck, Settings, User } from 'lucide-react';

const items = [
  { to: '/dashboard', icon: LayoutGrid, label: 'Asosiy' },
  { to: '/bookings', icon: CalendarCheck, label: 'Bandliklar' },
  { to: '/settings', icon: Settings, label: 'Sozlamalar' },
  { to: '/profile', icon: User, label: 'Profil' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
                isActive ? 'nav-active' : 'nav-inactive'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] font-${isActive ? '700' : '500'}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
