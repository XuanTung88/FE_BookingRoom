/**
 * AdminCustomersPage.jsx – REFACTORED
 *
 * API endpoints:
 *   GET    /api/admin/users?keyword=&pageIndex=&pageSize= → lấy tất cả user, lọc Customer ở FE
 *   GET    /api/profiles/customer/{khachHangId}            → hồ sơ cá nhân
 *   GET    /api/profiles/customer/{khachHangId}/bookings   → danh sách đặt phòng
 *   GET    /api/profiles/bookings/{datPhongId}/details     → chi tiết 1 đặt phòng
 *   DELETE /api/admin/users/{id}                           → xóa tài khoản
 *
 * khachHangId:
 *   Thường = user.id (UUID của NguoiDung)
 *   Một số API cũ dùng KhachHangId khác → thử user.id trước, fallback user.khachHangId
 *
 * UpdateCustomerProfileVM (nếu cần sau này):
 *   { hoTen, soDienThoai, cccdPassport, quocTich, ngaySinh (date-time), gioiTinh, queQuan }
 *   Note: field là "cccdPassport" (camelCase), KHÔNG phải "cccD_Passport"
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminSystemService } from '../services/admin.system.service';
import apiClient from '../services/api.client';
import { ENDPOINTS } from '../config/api.config';

const CUSTOMER_ROLE_NAMES = ['Customer', 'Khách hàng'];
const STAFF_ROLE_NAMES = ['SuperAdmin', 'Super Admin', 'Receptionist', 'Lễ tân', 'Housekeeper', 'Trực buồng'];

const fmt = (n) => n ? new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' ₫' : '—';
const fmtD = (s) => { if (!s) return '—'; const d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); };

const ST = {
  'Hoàn thành': { bg: '#dcfce7', color: '#166534' },
  'Đã nhận phòng': { bg: '#dbeafe', color: '#1d4ed8' },
  'Chờ xác nhận': { bg: '#fef9c3', color: '#854d0e' },
  'Đã hủy': { bg: '#fee2e2', color: '#dc2626' },
};
const getStatus = (s) => ST[s] ?? { bg: '#f3f4f6', color: '#6b7280' };

const AC = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'];
const aColor = (s = '') => AC[s.charCodeAt(0) % AC.length];
const inits = (s = '') => s.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || 'KH';

const getRoleNames = (u) => {
  const arr = u?.roles ?? u?.vaiTros ?? [];
  if (!Array.isArray(arr)) return [];
  return arr.map(r => typeof r === 'string' ? r : (r.tenVaiTro ?? r.name ?? ''));
};

const isCustomer = (u) => {
  const names = getRoleNames(u);
  if (!names.length) return false; // không có role = không hiển thị ở trang Customer
  return names.some(n => CUSTOMER_ROLE_NAMES.includes(n));
};

const ROOM_IMGS = [
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=80&q=80',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=80&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=80&q=80',
];

export default function AdminCustomersPage() {
  const [allCustomers, setAllCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE = 10;

  // Slide-over
  const [slideOpen, setSlideOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loadingSlide, setLoadingSlide] = useState(false);
  const [slideError, setSlideError] = useState('');

  // Booking detail expand (cache)
  const [detailMap, setDetailMap] = useState({});
  const [detailLoad, setDetailLoad] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const [toast, setToast] = useState('');
  const show = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminSystemService.getUsers({
        pageIndex: 1,
        pageSize: 1000, // Lấy toàn bộ để phân trang và lọc client-side
      });
      const items = Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
      // Lọc chỉ Customer
      const customers = items.filter(isCustomer);
      setAllCustomers(customers);
    } catch (e) {
      console.error('[Customers] getUsers:', e);
      setAllCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Tìm kiếm client-side
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return allCustomers;
    const q = search.toLowerCase();
    return allCustomers.filter(u =>
      (u.hoTen ?? '').toLowerCase().includes(q) ||
      (u.tenDangNhap ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.soDienThoai ?? '').toLowerCase().includes(q)
    );
  }, [allCustomers, search]);

  // Phân trang client-side
  const total = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredCustomers.slice((safePage - 1) * PAGE, safePage * PAGE);

  // Reset về trang 1 khi tìm kiếm thay đổi
  useEffect(() => { setPage(1); }, [search]);

  // Thống kê khách hàng
  const stats = useMemo(() => ({
    total: allCustomers.length,
    completed: allCustomers.filter(u => u.isProfileCompleted).length,
    pending: allCustomers.filter(u => !u.isProfileCompleted).length,
  }), [allCustomers]);

  const openSlide = async (user) => {
    setSelected(user);
    setSlideOpen(true);
    setProfile(null);
    setBookings([]);
    setDetailMap({});
    setExpandedId(null);
    setSlideError('');
    setLoadingSlide(true);

    // khachHangId = user.id (NguoiDung.Id)
    // Nếu server trả lỗi, thử user.khachHangId nếu có
    const khId = user.khachHangId ?? user.id;

    try {
      // const [pRes, bRes] = await Promise.allSettled([
      //   apiClient.get(ENDPOINTS.PROFILE_CUSTOMER(khId)),
      //   apiClient.get(ENDPOINTS.PROFILE_CUSTOMER_BOOKINGS(khId)),
      // ]);
      // if (pRes.status === 'fulfilled') setProfile(pRes.value.data);
      // else setSlideError('Không thể tải hồ sơ khách hàng.');

      // if (bRes.status === 'fulfilled') {
      //   const raw = bRes.value.data;
      //   setBookings(Array.isArray(raw) ? raw : []);
      // }
    } catch (e) {
      console.error('[Customers] openSlide:', e);
      setSlideError('Lỗi tải dữ liệu.');
    } finally { setLoadingSlide(false); }
  };

  const expandBooking = async (datPhongId) => {
    if (expandedId === datPhongId) { setExpandedId(null); return; }
    setExpandedId(datPhongId);
    if (detailMap[datPhongId] !== undefined) return; // cache hit
    setDetailLoad(p => ({ ...p, [datPhongId]: true }));
    try {
      const { data } = await apiClient.get(ENDPOINTS.PROFILE_BOOKING_DETAILS(datPhongId));
      setDetailMap(p => ({ ...p, [datPhongId]: data }));
    } catch (e) {
      console.error('[Customers] getBookingDetails:', e);
      setDetailMap(p => ({ ...p, [datPhongId]: null }));
    } finally { setDetailLoad(p => ({ ...p, [datPhongId]: false })); }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Xác nhận xóa tài khoản khách hàng này?')) return;
    try {
      await adminSystemService.deleteUser(userId);
      setSlideOpen(false);
      show('✓ Đã xóa tài khoản khách hàng.');
      load();
    } catch (e) { alert(e.response?.data?.message ?? 'Xóa tài khoản thất bại.'); }
  };

  const p = profile;

  return (
    <div className="h-full flex flex-col gap-5 relative">
      {toast && <div className="fixed top-6 right-6 z-[100] bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-2xl">{toast}</div>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        {[
          { label: 'Tổng khách hàng', value: stats.total, color: '#1d4ed8' },
          { label: 'Có hồ sơ', value: stats.completed, color: '#065f46' },
          { label: 'Chờ xác minh', value: stats.pending, color: '#854d0e' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{s.label}</p>
            <p className="text-3xl font-black" style={{ color: s.color }}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 gap-4 flex-wrap shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Danh sách Khách hàng</h2>
            <p className="text-xs text-gray-400 mt-0.5">Người dùng có vai trò Customer đăng ký đặt phòng</p>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input type="text" placeholder="Tìm theo tên, email..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 w-56" />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
              <tr>{['Khách hàng', 'Email', 'Số điện thoại', 'Trạng thái hồ sơ', 'Thao tác'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="py-20 text-center text-gray-400">Đang tải...</td></tr>
                : pageItems.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center">
                    <div className="text-4xl mb-3">👤</div>
                    <p className="text-gray-400">Không có khách hàng nào.</p>
                  </td></tr>
                ) : pageItems.map(u => (
                  <tr key={u.id} onClick={() => openSlide(u)}
                    className="border-b border-gray-50 hover:bg-gray-50/70 transition cursor-pointer">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: aColor(u.hoTen ?? u.email ?? '') }}>
                          {inits(u.hoTen ?? u.email ?? '')}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.hoTen ?? u.tenDangNhap ?? '—'}</p>
                          <p className="text-xs text-gray-400">{u.tenDangNhap}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{u.email ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {u.soDienThoai || <span className="text-gray-300 italic text-xs">Chưa có</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={u.isProfileCompleted
                          ? { background: '#dcfce7', color: '#166534' }
                          : { background: '#fef9c3', color: '#854d0e' }}>
                        {u.isProfileCompleted ? '✓ Đầy đủ' : 'Chưa hoàn thiện'}
                      </span>
                    </td>
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openSlide(u)} title="Xem hồ sơ"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(u.id)} title="Xóa"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50 shrink-0 text-xs text-gray-500">
            <span>
              Hiển thị {pageItems.length > 0 ? (safePage - 1) * PAGE + 1 : 0}–{(safePage - 1) * PAGE + pageItems.length} / {total} khách hàng
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="px-3 py-1.5 rounded border border-gray-200 hover:bg-white disabled:opacity-40 font-medium">Trước</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={`px-3 py-1.5 rounded border font-medium ${safePage === n ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 hover:bg-white'}`}>{n}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="px-3 py-1.5 rounded border border-gray-200 hover:bg-white disabled:opacity-40 font-medium">Tiếp</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Slide-over ─────────────────────────────────────────── */}
      {slideOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-[2px]" onClick={() => setSlideOpen(false)} />
          <div className="w-[520px] bg-white h-full flex flex-col shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: aColor(selected?.hoTen ?? selected?.email ?? '') }}>
                  {inits(selected?.hoTen ?? selected?.email ?? '')}
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">{selected?.hoTen ?? selected?.tenDangNhap ?? '—'}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Hồ sơ khách hàng & Lịch sử</p>
                </div>
              </div>
              <button onClick={() => setSlideOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {loadingSlide ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Đang tải hồ sơ...</div>
            ) : slideError && !p ? (
              <div className="flex-1 flex items-center justify-center flex-col gap-3 text-center px-6">
                <div className="text-4xl">⚠️</div>
                <p className="text-sm text-red-500 font-semibold">{slideError}</p>
                <p className="text-xs text-gray-400">ID: {selected?.id}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                {/* Thông tin cá nhân */}
                {p && (
                  <div className="px-6 py-5 border-b border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4">Thông tin & Nhận dạng</p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      {[
                        ['Ngày sinh', fmtD(p.ngaySinh)],
                        ['Quốc tịch', p.quocTich],
                        // UpdateCustomerProfileVM dùng "cccdPassport", CompleteProfileVM dùng "cccD_Passport"
                        ['CCCD / Hộ chiếu', p.cccdPassport ?? p.cccD_Passport],
                        ['Số điện thoại', p.soDienThoai],
                        ['Giới tính', p.gioiTinh],
                        ['Quê quán', p.queQuan],
                      ].filter(([, v]) => v).map(([k, v]) => (
                        <div key={k}>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{k}</p>
                          <p className="text-sm font-semibold text-gray-800">{v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <p className="text-[10px] text-gray-300 font-medium">khachHangId: {selected?.khachHangId ?? selected?.id}</p>
                    </div>
                  </div>
                )}

                {/* Lịch sử đặt phòng */}
                <div className="px-6 py-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4">
                    Lịch sử Đặt phòng ({bookings.length})
                  </p>
                  {bookings.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-6">Chưa có lần đặt phòng nào.</p>
                  ) : bookings.map((b, bi) => {
                    const id = b.id ?? b.datPhongId;
                    const st = getStatus(b.trangThai);
                    const det = detailMap[id];
                    const exp = expandedId === id;
                    return (
                      <div key={id} className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition mb-3">
                        <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/70"
                          onClick={() => expandBooking(id)}>
                          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                            <img src={ROOM_IMGS[bi % ROOM_IMGS.length]} alt="" className="w-full h-full object-cover"
                              onError={e => e.target.style.display = 'none'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {b.tenLoaiPhong ?? b.loaiPhong ?? `Đặt phòng #${String(id).slice(-6).toUpperCase()}`}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {fmtD(b.ngayNhanPhongDuKien)} — {fmtD(b.ngayTraPhongDuKien)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black" style={{ color: '#1d4ed8' }}>{fmt(b.tongTien ?? b.tongTienBooking)}</p>
                            <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full"
                              style={{ background: st.bg, color: st.color }}>
                              {b.trangThai ?? '—'}
                            </span>
                          </div>
                        </div>

                        {exp && (
                          <div className="px-4 pb-4 border-t border-gray-50 bg-gray-50/50">
                            {detailLoad[id] ? (
                              <p className="text-xs text-gray-400 py-3 text-center">Đang tải chi tiết...</p>
                            ) : det === null ? (
                              <p className="text-xs text-gray-400 py-3 text-center">Không thể tải chi tiết.</p>
                            ) : det ? (
                              <div className="pt-3 space-y-2.5">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-400">Mã đặt phòng</span>
                                  <code className="bg-white border border-gray-100 px-2 py-0.5 rounded font-bold text-gray-700">
                                    {String(id).slice(-8).toUpperCase()}
                                  </code>
                                </div>
                                {(det.chiTietDatPhongs ?? det.rooms ?? []).map((r, ri) => (
                                  <div key={ri} className="flex justify-between text-xs bg-white border border-gray-100 rounded-lg px-3 py-2.5">
                                    <span className="text-gray-700 font-medium">
                                      {r.tenLoaiPhong ?? r.loaiPhong ?? `Phòng ${ri + 1}`}
                                      {r.soPhong && <span className="text-gray-400 ml-1.5">· #{r.soPhong}</span>}
                                    </span>
                                    <span className="font-bold text-blue-700">{fmt(r.giaThucTe)}</span>
                                  </div>
                                ))}
                                {(det.hoaDon ?? det.invoice) && (
                                  <div className="bg-white border border-gray-100 rounded-lg px-3 py-2.5 space-y-1.5">
                                    {[
                                      ['Tổng tiền', fmt((det.hoaDon ?? det.invoice)?.tongTienBooking)],
                                      ['Thanh toán', (det.hoaDon ?? det.invoice)?.trangThaiThanhToan],
                                    ].map(([k, v]) => (
                                      <div key={k} className="flex justify-between text-xs">
                                        <span className="text-gray-400">{k}</span>
                                        <span className="font-semibold text-gray-700">{v}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex border-t border-gray-100 shrink-0">
              <button className="flex-1 py-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                Tải hồ sơ PDF
              </button>
              <button onClick={() => selected && handleDelete(selected.id)}
                className="flex-1 py-4 text-sm font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition"
                style={{ background: '#dc2626' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Xóa khách hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
