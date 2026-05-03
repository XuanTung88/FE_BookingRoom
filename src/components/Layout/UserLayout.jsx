import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getStorageItem, clearAuth } from '../../utils/storage.util';

export default function UserLayout({ children, title }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const user      = getStorageItem('user', {});

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItems = [
    {
      path : '/booking',
      label: 'Đặt phòng',
      icon : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      path : '/booking/history',
      label: 'Lịch sử đặt phòng',
      icon : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
  ];

  const isActive = (path) =>
    path === '/booking'
      ? location.pathname === '/booking' || location.pathname.startsWith('/booking/confirm') || location.pathname.startsWith('/booking/payment')
      : location.pathname.startsWith(path);

  return (
    <div className="flex min-h-screen" style={{ background: '#f5f5f0' }}>
      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside className="w-60 flex flex-col shrink-0" style={{ background: '#0d1b2e', minHeight: '100vh' }}>
        {/* Logo */}
        <div className="px-6 py-8 border-b border-white/10">
          <Link to="/" className="block text-xl font-bold tracking-tight"
            style={{ color: '#c9a84c', fontFamily: 'Georgia, serif', letterSpacing: '0.05em' }}>
            Hotel Moonlight
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium"
                style={{
                  background  : active ? 'rgba(201,168,76,0.15)' : 'transparent',
                  color       : active ? '#c9a84c' : 'rgba(255,255,255,0.55)',
                }}>
                <span style={{ color: active ? '#c9a84c' : 'rgba(255,255,255,0.4)' }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-6 border-t border-white/10">
          {user?.hoTen && (
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: '#c9a84c', color: '#0d1b2e' }}>
                {user.hoTen.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-medium text-white/80 truncate max-w-[100px]">{user.hoTen}</p>
                <p className="text-xs text-white/40">{user.role || 'Khách hàng'}</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#c9a84c'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-8 shrink-0">
          <span className="text-sm font-medium text-gray-600">
            {title || 'Hotel Moonlight'}
          </span>
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </Link>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}