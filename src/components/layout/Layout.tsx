import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="app-shell">
      <div className="page-scroll">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
