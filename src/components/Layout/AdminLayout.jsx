import { useNavigate, Link, useLocation } from 'react-router-dom';
import { clearAuth, getStorageItem } from "../../utils/storage.util";

// ────────────────────────────────────────────────────────────────
// AdminLayout – Khung giao diện admin (sidebar + header)
// ────────────────────────────────────────────────────────────────
export default function AdminLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  // ✅ Safe parse – fallback nếu user không tồn tại / không hợp lệ
  const user = getStorageItem('user', { hoTen: 'Quản Trị Hệ Thống' });

  const handleLogout = () => {
    clearAuth();          // xóa cả token lẫn user
    navigate('/login');
  };

  const menuGroups = [
    {
      title: 'Tổng quan',
      items: [
        { path: '/admin',  label: 'Dashboard Overview',  icon: '📊' },
        { path: '/',       label: 'Về Trang chủ khách', icon: '🏠' },
      ],
    },
    {
      title: 'Quản lý nghiệp vụ',
      items: [
        // Đã xóa menu '/admin/users' cũ ở đây
        { path: '/admin/pricing',    label: 'Chính sách giá',     icon: '💰' },
        { path: '/admin/room-types', label: 'Loại phòng',         icon: '🏷️' },
        { path: '/admin/rooms',      label: 'Danh sách phòng',    icon: '🛏️' },
        { path: '/admin/services',   label: 'Dịch vụ',            icon: '☕' },
        { path: '/admin/equipment',  label: 'Tài sản thiết bị',   icon: '💻' },
      ],
    },
    {
      // Thêm mới Group Quản lý Người Dùng cho 3 page mới
      title: 'Tài khoản & Phân quyền',
      items: [
        { path: '/admin/staff',      label: 'Nhân sự nội bộ',      icon: '👔' }, // Trang 1
        { path: '/admin/customers',  label: 'Khách hàng',          icon: '👥' }, // Trang 3
        { path: '/admin/roles',      label: 'Vai trò & Phân quyền',icon: '🔐' }, // Trang 2 (Chuyển từ dưới lên)
      ],
    },
    {
      title: 'Hệ thống & Cấu hình',
      items: [
        // Đã di chuyển '/admin/roles' lên nhóm trên để hợp logic hơn
        { path: '/admin/settings', label: 'Cấu hình chung',   icon: '⚙️' },
        { path: '/admin/logs',     label: 'Nhật ký hệ thống', icon: '📝' },
      ],
    },
  ];

  // Helper: lấy label của trang hiện tại cho header
  const currentLabel =
    menuGroups.flatMap((g) => g.items).find((i) => i.path === location.pathname)?.label
    ?? 'Dashboard';

  // Lấy chữ cái đầu an toàn
  const avatarLetter = (user?.hoTen ?? 'Q').charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-[#F3F6FD]">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="w-64 bg-white shadow-md flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b text-center shrink-0">
          <h2 className="text-2xl font-bold text-blue-700 flex items-center justify-center gap-2">
            <span>🌙</span> Moonlight
          </h2>
          <span className="text-xs text-gray-500 px-3 py-1 bg-gray-100 rounded-full mt-2 inline-block font-medium">
            Quản trị hệ thống
          </span>
        </div>

        {/* Nav menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-4">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-lg transition font-medium"
          >
            <span>🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 z-10 shrink-0">
          <h1 className="text-xl font-semibold text-gray-800">{currentLabel}</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              Xin chào, {user?.hoTen ?? 'Admin'}
            </span>
            <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              {avatarLetter}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}