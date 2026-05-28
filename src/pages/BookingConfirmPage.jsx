
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { bookingService } from '../services/booking.service';
import { profileService } from '../services/profile.service';
import { getUserIdFromToken } from '../utils/jwt.util';
import { getErrorMessage } from '../utils/error.util';

const fmt = (n) => n ? new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' ₫' : '0 ₫';
const fmtD = (s) => s ? new Date(s).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─────────────────────────────────────────────────────────────────
// LUỒNG LOGIC ĐÃ SỬA ĐỔI:
// 1. KhachHangId: Lấy từ RoleId trong JWT (Định danh thực thể Khách hàng trong DB).
// 2. Hiển thị: Gọi GET /api/profiles/customer/{khachHangId} để lấy thông tin mới nhất.
// 3. Tạo Booking: Gửi POST /api/bookings với khachHangId này làm chủ thể đặt phòng.
// ─────────────────────────────────────────────────────────────────

export default function BookingConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const s = location.state || {};
  const { checkIn, checkOut, nights, selectedRooms = [], grandTotal = 0 } = s;

  const [customerProfile, setCustomerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lấy khachHangId từ Token (Sử dụng 'roleId' - Claim RoleId chứa ID Khách hàng)
  const token = localStorage.getItem('token');
  const khachHangId = getUserIdFromToken(token, 'roleId');

  useEffect(() => {
    if (!khachHangId) {
      setProfileError('Không xác định được mã khách hàng. Vui lòng hoàn thiện hồ sơ hoặc đăng nhập lại.');
      setProfileLoading(false);
      return;
    }
    // Lấy thông tin khách hàng từ API để hiển thị lên UI xác nhận
    profileService.getCustomer(khachHangId)
      .then(({ data }) => setCustomerProfile(data))
      .catch(() => setProfileError('Không thể tải thông tin khách hàng từ hệ thống.'))
      .finally(() => setProfileLoading(false));
  }, [khachHangId]);

  if (!selectedRooms.length) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f6f8' }}>
        <div className="text-center p-8">
          <p className="text-gray-500 mb-4">Không có thông tin phòng đã chọn.</p>
          <button onClick={() => navigate('/booking')} className="px-6 py-2.5 text-sm font-bold text-white rounded-sm" style={{ background: '#00224f' }}>
            Quay lại chọn phòng
          </button>
        </div>
      </div>
    );
  }

  const handleConfirm = async () => {
    if (!token) { navigate('/login?redirect=/booking'); return; }

    // KIỂM TRA QUAN TRỌNG: Phải có khachHangId (RoleId) mới được phép tạo booking
    if (!khachHangId) {
      setError('Lỗi định danh: Không tìm thấy mã khách hàng trong Token. Vui lòng đăng nhập lại.');
      return;
    }

    setError(''); setLoading(true);
    try {
      const payload = {
        // SỬA ĐỔI: Sử dụng khachHangId (RoleId) thay vì userId (Identity ID)
        // Điều này đảm bảo trùng khớp với dữ liệu đã dùng để GET Profile phía trên.
        khachHangId: khachHangId,
        ngayNhanPhongDuKien: new Date(checkIn).toISOString(),
        ngayTraPhongDuKien: new Date(checkOut).toISOString(),
        roomDetails: selectedRooms.map(r => ({
          phongId: r.phongId,
          giaThucTe: r.giaThucTe,
        })),
      };

      const { data } = await bookingService.create(payload);
      const bookingId = data?.bookingId ?? data?.BookingId;

      navigate('/booking/payment', {
        state: { bookingId, checkIn, checkOut, nights, selectedRooms, grandTotal, khachHang: customerProfile },
      });
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Tài khoản của bạn chưa được cấp quyền đặt phòng. Hãy đảm bảo bạn đã hoàn thiện hồ sơ.');
      } else {
        setError(getErrorMessage(err, 'Hệ thống gặp lỗi khi tạo đơn đặt phòng.'));
      }
    } finally { setLoading(false); }
  };

  const groupedRooms = selectedRooms.reduce((acc, r) => {
    const k = r.loaiPhong || 'Phòng';
    if (!acc[k]) acc[k] = [];
    acc[k].push(r);
    return acc;
  }, {});

  const cp = customerProfile;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f5f6f8', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>

      {/* Header & Steps */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold" style={{ color: '#00224f', fontFamily: 'Georgia, serif' }}>
            Hotel<span style={{ color: '#c9a84c' }}>Moonlight</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
            {['Tìm phòng', 'Xác nhận', 'Thanh toán'].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: i <= 1 ? '#00224f' : '#e5e7eb', color: i <= 1 ? '#fff' : '#9ca3af' }}>
                    {i + 1}
                  </div>
                  <span style={{ color: i <= 1 ? '#00224f' : '#9ca3af' }}>{label}</span>
                </div>
                {i < 2 && <div className="w-8 h-px" style={{ background: i < 1 ? '#00224f' : '#e5e7eb' }} />}
              </div>
            ))}
          </div>
          <Link to="/booking" className="text-sm text-gray-500 hover:text-gray-800">‹ Đặt phòng khác</Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>Xác nhận đặt phòng</h1>
          <p className="text-sm text-gray-500">Vui lòng kiểm tra lại thông tin khách hàng và danh sách phòng trước khi thanh toán.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT CONTENT */}
          <div className="flex-1 min-w-0 space-y-5">
            {error && <div className="px-4 py-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm">{error}</div>}

            {/* Thông tin khách hàng (Lấy từ API) */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between" style={{ background: '#f8f9fa' }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">👤</span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Thông tin khách hàng</h3>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">Dữ liệu hệ thống</span>
              </div>

              {profileLoading ? (
                <div className="p-8 text-center text-gray-400 text-sm italic">Đang đồng bộ dữ liệu khách hàng...</div>
              ) : profileError ? (
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-sm text-sm text-red-600 mb-3">{profileError}</div>
                  <button onClick={() => navigate('/login')} className="text-xs font-bold text-blue-600 underline">Đăng nhập lại để cập nhật</button>
                </div>
              ) : (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ROField label="Họ và tên" value={cp?.hoTen} />
                  <ROField label="Email" value={cp?.email} />
                  <ROField label="Số điện thoại" value={cp?.soDienThoai} />
                  <ROField label="CCCD / Hộ chiếu" value={cp?.cccdPassport ?? cp?.cccD_Passport} />
                  <ROField label="Quốc tịch" value={cp?.quocTich} />
                  <ROField label="Quê quán" value={cp?.queQuan} />
                </div>
              )}
            </div>




            {/* Danh sách phòng */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2" style={{ background: '#f8f9fa' }}>
                <span className="text-lg">🛏</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Chi tiết phòng đã chọn</h3>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(groupedRooms).map(([loai, rooms]) => (
                  <div key={loai}>
                    <p className="text-sm font-bold text-gray-800 mb-2">{loai} <span className="font-normal text-gray-500">({rooms.length} phòng)</span></p>
                    {rooms.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-sm px-4 py-3 rounded-sm mb-2" style={{ background: '#f8f9fa', border: '1px solid #e5e7eb' }}>
                        <div>
                          <span className="font-medium text-gray-700">Phòng {r.soPhong || `#${i + 1}`}</span>
                          <span className="text-gray-400 ml-2">| Tầng {r.tang || '—'}</span>
                        </div>
                        <span className="font-bold text-gray-900">{fmt(r.giaThucTe)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: Bill Summary */}
          <div className="w-full lg:w-[360px] shrink-0">
            <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden sticky top-24">
              <div className="px-6 py-4" style={{ background: '#00224f' }}>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Tổng cộng</h3>
              </div>

              <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
                <div className="p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Ngày đến</p>
                  <p className="text-sm font-bold text-gray-900">{fmtD(checkIn)}</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Ngày đi</p>
                  <p className="text-sm font-bold text-gray-900">{fmtD(checkOut)}</p>
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-xs text-gray-500">{nights} đêm · {selectedRooms.length} phòng</p>
                    <p className="text-sm font-bold text-gray-800 mt-1 uppercase">Thanh toán 100%</p>
                  </div>
                  <span className="text-2xl font-black" style={{ color: '#c9a84c' }}>{fmt(grandTotal)}</span>
                </div>

                <button onClick={handleConfirm}
                  disabled={loading || profileLoading || !!profileError}
                  className="w-full py-4 text-base font-bold uppercase tracking-widest text-white transition disabled:opacity-60 rounded-sm shadow-md"
                  style={{ background: '#c9a84c' }}>
                  {loading ? 'Đang xử lý...' : 'Xác nhận & Thanh toán →'}
                </button>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-sm">
                  <p className="text-[11px] text-amber-700 leading-relaxed italic text-center">
                    Ghi chú: Bạn sẽ không thể sửa thông tin sau khi bấm xác nhận.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Component hiển thị trường dữ liệu chỉ đọc
function ROField({ label, value }) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">{label}</label>
      <div className="border border-gray-200 rounded-sm px-4 py-3 text-sm font-medium text-gray-800 bg-gray-50 min-h-[44px] flex items-center">
        {value || <span className="text-gray-300 italic text-xs">Chưa có thông tin</span>}
      </div>
    </div>
  );
}

