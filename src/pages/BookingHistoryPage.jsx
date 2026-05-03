import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { profileService } from '../services/profile.service';
import { getStorageItem, clearAuth } from '../utils/storage.util';
import { getUserIdFromToken, getRoleFromToken, isAdminRole } from '../utils/jwt.util';

const fmt  = (n) => n ? new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' ₫' : '—';
const fmtD = (s) => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const fmtDInput = (s) => {
  if (!s) return '';
  try { return new Date(s).toISOString().split('T')[0]; } catch { return ''; }
};

const STATUS = {
  'Chờ xác nhận': { color: '#3b82f6', bg: '#eff6ff' },
  'Đã xác nhận' : { color: '#f59e0b', bg: '#fffbeb' },
  'Đã nhận phòng':{ color: '#10b981', bg: '#f0fdf4' },
  'Hoàn thành'  : { color: '#6b7280', bg: '#f9fafb' },
  'Đã hủy'      : { color: '#ef4444', bg: '#fef2f2' },
};
const getStatus = (s) => STATUS[s] || { color: '#6b7280', bg: '#f9fafb' };

// ─────────────────────────────────────────────────────────────────
// Layout 2 cột:
//   LEFT  – Thông tin cá nhân (GET + PUT /api/profiles/customer/{id})
//   RIGHT – Lịch sử đặt phòng (GET .../bookings + GET .../bookings/{id}/details)
// KhachHangId = roleId trong JWT
// ─────────────────────────────────────────────────────────────────
export default function BookingHistoryPage() {
  const navigate  = useNavigate();
  const user      = getStorageItem('user', {});
  const [showMenu, setShowMenu] = useState(false);

  const token       = localStorage.getItem('token');
  const khachHangId = getUserIdFromToken(token, 'roleId');
  const isAdmin     = isAdminRole(getRoleFromToken(token));

  // ── Profile state ─────────────────────────────────────────────
  const [profile,        setProfile]        = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editMode,       setEditMode]       = useState(false);
  const [editForm,       setEditForm]       = useState({});
  const [saveLoading,    setSaveLoading]    = useState(false);
  const [saveMsg,        setSaveMsg]        = useState('');

  // ── Bookings state ────────────────────────────────────────────
  const [bookings,        setBookings]        = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [expandedId,      setExpandedId]      = useState(null);
  const [details,         setDetails]         = useState({});  // { datPhongId: detailData }
  const [detailLoading,   setDetailLoading]   = useState({});

  // ── Load profile ──────────────────────────────────────────────
  useEffect(() => {
    if (!khachHangId) { setProfileLoading(false); return; }
    profileService.getCustomer(khachHangId)
      .then(({ data }) => { setProfile(data); setEditForm(data); })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [khachHangId]);

  // ── Load bookings ─────────────────────────────────────────────
  useEffect(() => {
    if (!khachHangId) { setBookingsLoading(false); return; }
    profileService.getBookings(khachHangId)
      .then(({ data }) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setBookingsLoading(false));
  }, [khachHangId]);

  // ── Load chi tiết đặt phòng khi expand ───────────────────────
  const handleExpand = async (datPhongId) => {
    if (expandedId === datPhongId) { setExpandedId(null); return; }
    setExpandedId(datPhongId);
    if (details[datPhongId]) return; // đã có cache
    setDetailLoading(p => ({ ...p, [datPhongId]: true }));
    try {
      const { data } = await profileService.getBookingDetails(datPhongId);
      setDetails(p => ({ ...p, [datPhongId]: data }));
    } catch { setDetails(p => ({ ...p, [datPhongId]: null })); }
    finally { setDetailLoading(p => ({ ...p, [datPhongId]: false })); }
  };

  // ── Lưu profile ───────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSaveLoading(true);
    setSaveMsg('');
    try {
      await profileService.updateCustomer(khachHangId, editForm);
      setProfile({ ...profile, ...editForm });
      setEditMode(false);
      setSaveMsg('✓ Cập nhật thành công!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg(err.response?.data?.message ?? 'Lưu thất bại. Vui lòng thử lại.');
    } finally { setSaveLoading(false); }
  };

  const handleLogout = () => { clearAuth(); setShowMenu(false); navigate('/'); };

  const ef = editForm;
  const setEF = (field, val) => setEditForm(p => ({ ...p, [field]: val }));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f5f6f8', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>

      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <Link to="/" className="text-2xl font-bold shrink-0" style={{ color: '#00224f', fontFamily: 'Georgia, serif' }}>
            Hotel<span style={{ color: '#c9a84c' }}>Moonlight</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link to="/" className="hover:text-gray-900">Trang chủ</Link>
            <Link to="/booking" className="hover:text-gray-900">Đặt phòng</Link>
            <Link to="/booking/history" className="font-bold border-b-2" style={{ color: '#00224f', borderColor: '#c9a84c' }}>Hồ sơ & Lịch sử</Link>
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            {user?.hoTen ? (
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-sm border border-gray-200 hover:border-gray-400 bg-white">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#00224f' }}>
                    {user.hoTen.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-800 max-w-[90px] truncate">{user.hoTen}</span>
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 shadow-xl rounded-sm py-1 z-50">
                    {isAdmin && <Link to="/admin" onClick={() => setShowMenu(false)} className="block px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50">Quản trị</Link>}
                    <Link to="/booking" onClick={() => setShowMenu(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Đặt phòng mới</Link>
                    <div className="border-t border-gray-100 my-1"/>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">Đăng xuất</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="text-sm font-bold px-5 py-2.5 rounded-sm text-white" style={{ background: '#00224f' }}>Đăng nhập</Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>Hồ sơ & Lịch sử đặt phòng</h1>
          <p className="text-sm text-gray-500">Quản lý thông tin cá nhân và xem lại các chuyến nghỉ của bạn.</p>
        </div>

        {/* ══ 2-PANEL LAYOUT ═════════════════════════════════════ */}
        <div className="flex flex-col xl:flex-row gap-8">

          {/* ────────────────────────────────────────────────────
              PANEL LEFT: Thông tin cá nhân
          ─────────────────────────────────────────────────────── */}
          <div className="w-full xl:w-[380px] shrink-0">
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden sticky top-24">

              {/* Header */}
              <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100" style={{ background: '#00224f' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: '#c9a84c', color: '#00224f' }}>
                    {(profile?.hoTen || user?.hoTen || 'K').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{profile?.hoTen || user?.hoTen || '—'}</p>
                    <p className="text-xs text-white/60">{profile?.email || user?.email || '—'}</p>
                  </div>
                </div>
                {!editMode ? (
                  <button onClick={() => setEditMode(true)}
                    className="text-xs font-bold px-3 py-1.5 rounded-sm transition"
                    style={{ background: 'rgba(201,168,76,0.2)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.4)' }}>
                    Chỉnh sửa
                  </button>
                ) : (
                  <button onClick={() => { setEditMode(false); setEditForm(profile || {}); }}
                    className="text-xs font-bold px-3 py-1.5 rounded-sm text-white/60 hover:text-white transition">
                    Hủy
                  </button>
                )}
              </div>

              {/* Save message */}
              {saveMsg && (
                <div className={`px-5 py-2.5 text-xs font-semibold text-center ${saveMsg.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  {saveMsg}
                </div>
              )}

              {profileLoading ? (
                <div className="p-8 text-center text-gray-400 text-sm">Đang tải...</div>
              ) : !khachHangId ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-500 mb-3">Vui lòng đăng nhập để xem hồ sơ.</p>
                  <button onClick={() => navigate('/login')} className="text-sm font-bold px-5 py-2 rounded-sm text-white" style={{ background: '#00224f' }}>Đăng nhập</button>
                </div>
              ) : editMode ? (
                /* ── Edit form ─────────────────────────────── */
                <div className="p-5 space-y-4">
                  <PF label="Họ và tên"       value={ef.hoTen || ''}        onChange={v => setEF('hoTen', v)} />
                  <PF label="Số điện thoại"  value={ef.soDienThoai || ''}  onChange={v => setEF('soDienThoai', v)} type="tel" />
                  <PF label="CCCD / Hộ chiếu" value={ef.cccdPassport ?? ef.cccD_Passport ?? ''} onChange={v => setEF('cccdPassport', v)} />
                  <PF label="Quốc tịch"       value={ef.quocTich || ''}     onChange={v => setEF('quocTich', v)} />
                  <PF label="Ngày sinh"       value={fmtDInput(ef.ngaySinh)} onChange={v => setEF('ngaySinh', v)} type="date" />
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Giới tính</label>
                    <select value={ef.gioiTinh || ''} onChange={e => setEF('gioiTinh', e.target.value)}
                      className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm rounded-sm focus:outline-none focus:border-gray-500">
                      <option value="">-- Chọn --</option>
                      <option>Nam</option><option>Nữ</option><option>Khác</option>
                    </select>
                  </div>
                  <PF label="Quê quán" value={ef.queQuan || ''} onChange={v => setEF('queQuan', v)} />

                  <button onClick={handleSaveProfile} disabled={saveLoading}
                    className="w-full py-3 text-sm font-bold uppercase tracking-widest text-white rounded-sm disabled:opacity-60 transition"
                    style={{ background: '#c9a84c', color: '#00224f' }}>
                    {saveLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              ) : (
                /* ── View mode ─────────────────────────────── */
                <div className="p-5 space-y-0 divide-y divide-gray-100">
                  {[
                    ['Họ và tên',       profile?.hoTen],
                    ['Email',           profile?.email],
                    ['Số điện thoại',  profile?.soDienThoai],
                    ['CCCD / Hộ chiếu', profile?.cccdPassport ?? profile?.cccD_Passport],
                    ['Quốc tịch',       profile?.quocTich],
                    ['Giới tính',       profile?.gioiTinh],
                    ['Ngày sinh',       profile?.ngaySinh ? fmtD(profile.ngaySinh) : null],
                    ['Quê quán',        profile?.queQuan],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center py-3">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</span>
                      <span className="text-sm font-semibold text-gray-800 text-right max-w-[180px]">
                        {value || <span className="text-gray-300 italic text-xs font-normal">Chưa cung cấp</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ────────────────────────────────────────────────────
              PANEL RIGHT: Lịch sử đặt phòng
          ─────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Stats */}
            {!bookingsLoading && bookings.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Tổng đặt phòng',   value: bookings.length,                                                       icon: '🛏️' },
                  { label: 'Hoàn thành',        value: bookings.filter(b => b.trangThai === 'Hoàn thành').length,             icon: '✅' },
                  { label: 'Đang xử lý',        value: bookings.filter(b => !['Hoàn thành','Đã hủy'].includes(b.trangThai)).length, icon: '⏳' },
                  { label: 'Tổng chi tiêu',     value: fmt(bookings.reduce((s, b) => s + (b.tongTien ?? b.tongTienBooking ?? 0), 0)), icon: '💰' },
                ].map((st, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-sm p-4 shadow-sm">
                    <div className="text-xl mb-1">{st.icon}</div>
                    <p className="text-xl font-black text-gray-900">{st.value}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{st.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Bookings list */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between" style={{ background: '#f8f9fa' }}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Danh sách đặt phòng</h2>
                <Link to="/booking" className="text-xs font-bold px-4 py-2 rounded-sm text-white transition"
                  style={{ background: '#c9a84c', color: '#00224f' }}>
                  + Đặt phòng mới
                </Link>
              </div>

              {bookingsLoading ? (
                <div className="p-12 text-center text-gray-400">Đang tải lịch sử...</div>
              ) : !khachHangId ? (
                <div className="p-12 text-center text-gray-400">Vui lòng đăng nhập.</div>
              ) : bookings.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="text-5xl mb-4">🏨</div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">Chưa có đặt phòng nào</h3>
                  <p className="text-sm text-gray-500 mb-5">Hãy bắt đầu kỳ nghỉ hoàn hảo của bạn!</p>
                  <Link to="/booking" className="text-sm font-bold px-8 py-3 rounded-sm text-white" style={{ background: '#00224f' }}>
                    Tìm phòng ngay
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {bookings.map((b) => {
                    const id     = b.id ?? b.datPhongId;
                    const st     = getStatus(b.trangThai);
                    const isOpen = expandedId === id;
                    const det    = details[id];
                    const detL   = detailLoading[id];

                    return (
                      <div key={id}>
                        {/* Booking row */}
                        <div className="px-6 py-5 hover:bg-gray-50/70 transition cursor-pointer"
                          onClick={() => handleExpand(id)}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span className="text-sm font-bold" style={{ color: '#00224f' }}>
                                  #{String(id).slice(-8).toUpperCase()}
                                </span>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-sm"
                                  style={{ background: st.bg, color: st.color }}>
                                  {b.trangThai}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                <span>📅 {fmtD(b.ngayNhanPhongDuKien)} → {fmtD(b.ngayTraPhongDuKien)}</span>
                                {b.soPhong && <span>🛏 Phòng {b.soPhong}</span>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-base font-black" style={{ color: '#c9a84c' }}>
                                {fmt(b.tongTien ?? b.tongTienBooking)}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">{isOpen ? '▲ Thu gọn' : '▼ Xem chi tiết'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isOpen && (
                          <div className="px-6 pb-6 border-t border-gray-100" style={{ background: '#fafafa' }}>
                            {detL ? (
                              <div className="py-6 text-center text-gray-400 text-sm">Đang tải chi tiết...</div>
                            ) : !det ? (
                              <div className="py-4 text-center text-gray-400 text-sm">Không thể tải chi tiết.</div>
                            ) : (
                              <div className="pt-5 space-y-5">
                                {/* Phòng */}
                                {(det.chiTietDatPhongs ?? det.rooms ?? []).length > 0 && (
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Phòng đã đặt</p>
                                    <div className="space-y-2">
                                      {(det.chiTietDatPhongs ?? det.rooms ?? []).map((r, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm px-4 py-3 rounded-sm"
                                          style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                                          <div>
                                            <span className="font-semibold text-gray-800">
                                              {r.tenLoaiPhong ?? r.loaiPhong ?? `Phòng ${i+1}`}
                                            </span>
                                            {r.soPhong && <span className="text-gray-400 ml-2">· Phòng {r.soPhong}</span>}
                                          </div>
                                          <span className="font-bold" style={{ color: '#c9a84c' }}>
                                            {fmt(r.giaThucTe)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Dịch vụ sử dụng */}
                                {(det.dichVuSuDung ?? det.services ?? []).length > 0 && (
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Dịch vụ sử dụng</p>
                                    <div className="space-y-1.5">
                                      {(det.dichVuSuDung ?? det.services ?? []).map((sv, i) => (
                                        <div key={i} className="flex justify-between text-sm px-4 py-2.5 rounded-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                                          <span className="text-gray-700">{sv.tenDichVu ?? sv.dichVu ?? `Dịch vụ ${i+1}`} × {sv.soLuong ?? 1}</span>
                                          <span className="font-semibold text-gray-700">{fmt(sv.thanhTien)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Hóa đơn */}
                                {(det.hoaDon ?? det.invoice) && (
                                  <div className="border border-gray-200 rounded-sm overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-100" style={{ background: '#f8f9fa' }}>
                                      <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Hóa đơn</p>
                                    </div>
                                    <div className="px-4 py-3 space-y-2">
                                      {[
                                        ['Tổng tiền phòng', (det.hoaDon ?? det.invoice)?.tongTienBooking],
                                        ['Trạng thái',      (det.hoaDon ?? det.invoice)?.trangThaiThanhToan],
                                      ].map(([l, v]) => v != null && (
                                        <div key={l} className="flex justify-between text-sm">
                                          <span className="text-gray-500">{l}</span>
                                          <span className="font-semibold text-gray-800">{typeof v === 'number' ? fmt(v) : v}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <p className="text-lg font-bold" style={{ color: '#00224f', fontFamily: 'Georgia, serif' }}>
            Hotel<span style={{ color: '#c9a84c' }}>Moonlight</span>
          </p>
          <p>© 2026 Hotel Moonlight.</p>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────
function PF({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm rounded-sm focus:outline-none focus:border-gray-500 transition"/>
    </div>
  );
}
