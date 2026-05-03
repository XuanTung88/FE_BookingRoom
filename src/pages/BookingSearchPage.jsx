import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { bookingService } from '../services/booking.service';
import { roomTypeService } from '../services/roomType.service';
import { getStorageItem, clearAuth } from '../utils/storage.util';
import { getRoleFromToken, isAdminRole } from '../utils/jwt.util';
import { pricingService } from '../services/pricing.service';

const fmt = (n) => n ? new Intl.NumberFormat('vi-VN').format(Math.round(n)) : '0';
const fmtVD = (n) => fmt(n) + ' ₫';
const today = () => new Date().toISOString().split('T')[0];
const addD = (s, n) => { const d = new Date(s); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
const nightCount = (a, b) => (!a || !b) ? 0 : Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));

const FALLBACK = [
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80',
];

const priceCalendar = (startStr, ppn) => {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startStr); d.setDate(d.getDate() + i);
    const dow = d.getDay();
    const wd = dow === 0 || dow === 6;
    return { date: d.toISOString().split('T')[0], label: `${days[dow]} ${d.getDate()}/${d.getMonth() + 1}`, price: wd ? Math.round(ppn * 1.22) : ppn, wd };
  });
};

export default function BookingSearchPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const t = today();

  const [checkIn, setCheckIn] = useState(sp.get('checkIn') || t);
  const [checkOut, setCheckOut] = useState(sp.get('checkOut') || addD(t, 2));
  const [adults, setAdults] = useState(2);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [apiRooms, setApiRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [error, setError] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  // qty: { [loaiPhongId]: number } – số phòng user chọn mỗi loại
  const [qty, setQty] = useState({});
  const [subtotals, setSubtotals] = useState({}); // 👉 THÊM DÒNG NÀY ĐỂ LƯU TIỀN TỪNG HẠNG PHÒNG

  const token = localStorage.getItem('token');
  const user = getStorageItem('user');
  const isAdmin = isAdminRole(token ? getRoleFromToken(token) : null);
  const n = nightCount(checkIn, checkOut);

  useEffect(() => {
    roomTypeService.getAll().then(r => setRoomTypes(r.data || [])).catch(() => { });
    if (sp.get('checkIn') && sp.get('checkOut')) handleSearch();
  }, []); // eslint-disable-line

  const handleSearch = async () => {
    if (!checkIn || !checkOut || checkOut <= checkIn) { setError('Vui lòng chọn ngày hợp lệ.'); return; }

    setError(''); setLoading(true); setQty({}); setSubtotals({}); // 👉 THÊM setSubtotals({});
    try {
      const res = await bookingService.getAvailableRooms(new Date(checkIn).toISOString(), new Date(checkOut).toISOString());
      setApiRooms(res.data || []);
      setSearched(true);
    } catch { setError('Không thể tải danh sách phòng.'); }
    finally { setLoading(false); }
  };

  // Enrich API response với roomType catalog (ảnh, mô tả)
  const enriched = apiRooms.map((item, i) => {
    const rt = roomTypes.find(r => r.id === (item.loaiPhongId ?? item.LoaiPhongId) || r.tenLoaiPhong === (item.tenLoaiPhong ?? item.TenLoaiPhong)) || {};
    const ppn = item.giaThucTe ?? item.GiaThucTe ?? item.giaCoBan ?? item.GiaCoBan ?? rt.giaCoBan ?? 0;
    return {
      loaiPhongId: item.loaiPhongId ?? item.LoaiPhongId,
      tenLoaiPhong: item.tenLoaiPhong ?? item.TenLoaiPhong ?? rt.tenLoaiPhong ?? `Loại phòng ${i + 1}`,
      pricePerNight: ppn,
      availableCount: item.availableCount ?? item.AvailableCount ?? 0,
      soNguoiToiDa: item.soNguoiToiDa ?? rt.soNguoiToiDa ?? 2,
      moTa: rt.moTa ?? item.moTa ?? 'Phòng tiện nghi, thoải mái với đầy đủ tiện ích.',
      anhDaiDien: rt.anhDaiDien ?? item.anhDaiDien ?? null,
      // Danh sách phòng cụ thể: [{phongId, soPhong, tang}]
      rooms: (item.rooms ?? item.Rooms ?? []).map(r => ({
        phongId: r.phongId ?? r.PhongId,
        soPhong: r.soPhong ?? r.SoPhong,
        tang: r.tang ?? r.Tang,
      })),
    };
  });

  const displayList = searched ? enriched : roomTypes.map((rt) => ({
    loaiPhongId: rt.id, tenLoaiPhong: rt.tenLoaiPhong, pricePerNight: rt.giaCoBan || 0,
    availableCount: null, soNguoiToiDa: rt.soNguoiToiDa ?? 2,
    moTa: rt.moTa ?? '', anhDaiDien: rt.anhDaiDien ?? null, rooms: [],
  }));

  // // Tổng tiền toàn bộ đơn đặt (100% tiền phòng)
  // const grandTotal = displayList.reduce((sum, type) => {
  //   const q = qty[type.loaiPhongId] || 0;
  //   return sum + type.pricePerNight * q * n;
  // }, 0);

  // const selectedCount = Object.values(qty).filter(v => v > 0).length;

  // const handleConfirmBooking = () => {
  //   if (!user) { navigate('/login?redirect=/booking'); return; }

  //   // Gom tất cả phòng được chọn vào 1 mảng để truyền sang ConfirmPage
  //   const selectedRooms = [];
  //   for (const [loaiPhongId, count] of Object.entries(qty)) {
  //     if (!count) continue;
  //     const type = enriched.find(r => r.loaiPhongId === loaiPhongId);
  //     if (!type) continue;
  //     type.rooms.slice(0, count).forEach(room => {
  //       selectedRooms.push({
  //         phongId: room.phongId,
  //         soPhong: room.soPhong,
  //         tang: room.tang,
  //         loaiPhong: type.tenLoaiPhong,
  //         // giaThucTe = tổng giá phòng đó cho toàn bộ kỳ nghỉ (theo logic backend)
  //         giaThucTe: type.pricePerNight * n,
  //         pricePerNight: type.pricePerNight,
  //         anhDaiDien: type.anhDaiDien,
  //       });
  //     });
  //   }
  //   if (!selectedRooms.length) return;

  //   navigate('/booking/confirm', {
  //     state: { checkIn, checkOut, nights: n, selectedRooms, grandTotal },
  //   });
  // };
  // 👉 1. TÍNH TỔNG TIỀN DỰA TRÊN TIỀN THỰC TẾ ĐÃ CỘNG DỒN
  const grandTotal = Object.values(subtotals).reduce((sum, val) => sum + val, 0);

  const selectedCount = Object.values(qty).filter(v => v > 0).length;

  const handleConfirmBooking = () => {
    if (!user) { navigate('/login?redirect=/booking'); return; }

    const selectedRooms = [];
    for (const [loaiPhongId, count] of Object.entries(qty)) {
      if (!count) continue;
      const type = enriched.find(r => r.loaiPhongId === loaiPhongId);
      if (!type) continue;

      // 👉 2. CHIA ĐỀU TIỀN THỰC TẾ CHO SỐ LƯỢNG PHÒNG
      const totalCuaLoaiPhongNay = subtotals[loaiPhongId] || 0;
      const giaCuaMotPhong = totalCuaLoaiPhongNay / count;

      type.rooms.slice(0, count).forEach(room => {
        selectedRooms.push({
          phongId: room.phongId,
          soPhong: room.soPhong,
          tang: room.tang,
          loaiPhong: type.tenLoaiPhong,
          giaThucTe: giaCuaMotPhong, // Lấy giá đã qua chính sách
          pricePerNight: giaCuaMotPhong / n,
          anhDaiDien: type.anhDaiDien,
        });
      });
    }
    if (!selectedRooms.length) return;

    navigate('/booking/confirm', {
      state: { checkIn, checkOut, nights: n, selectedRooms, grandTotal },
    });
  };

  const handleLogout = () => { clearAuth(); setShowMenu(false); navigate('/'); };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f5f6f8', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>

      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <Link to="/" className="shrink-0 text-2xl font-bold" style={{ color: '#00224f', fontFamily: 'Georgia, serif' }}>
            Hotel<span style={{ color: '#c9a84c' }}>Moonlight</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link to="/" className="hover:text-gray-900">Trang chủ</Link>
            <Link to="/booking" className="font-bold border-b-2" style={{ color: '#00224f', borderColor: '#c9a84c' }}>Đặt phòng</Link>
            <Link to="#" className="hover:text-gray-900">Dịch vụ</Link>
            <Link to="#" className="hover:text-gray-900">Liên hệ</Link>
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            {!user ? (
              <>
                <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-gray-900">Đăng nhập</Link>
                <Link to="/register" className="text-sm font-bold px-5 py-2.5 rounded-sm text-white" style={{ background: '#c9a84c' }}>Đăng ký</Link>
              </>
            ) : (
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-sm border border-gray-200 hover:border-gray-400 bg-white">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#00224f' }}>
                    {user?.hoTen?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-800 max-w-[90px] truncate">{user?.hoTen}</span>
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 shadow-xl rounded-sm py-1 z-50">
                    {isAdmin && <Link to="/admin" onClick={() => setShowMenu(false)} className="block px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50">Quản trị</Link>}
                    <Link to="/booking/history" onClick={() => setShowMenu(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Lịch sử đặt phòng</Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">Đăng xuất</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* DATE BAR */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Nhận phòng</span>
              <input type="date" value={checkIn} min={today()} onChange={e => { setCheckIn(e.target.value); if (e.target.value >= checkOut) setCheckOut(addD(e.target.value, 1)); }} className="border-none outline-none text-base font-bold text-gray-800 bg-transparent cursor-pointer" />
            </div>
            <div className="hidden sm:block w-px h-8 bg-gray-200" />
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Trả phòng</span>
              <input type="date" value={checkOut} min={addD(checkIn, 1)} onChange={e => setCheckOut(e.target.value)} className="border-none outline-none text-base font-bold text-gray-800 bg-transparent cursor-pointer" />
            </div>
            <div className="hidden sm:block w-px h-8 bg-gray-200" />
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Số khách</span>
              <select value={adults} onChange={e => setAdults(Number(e.target.value))} className="border-none outline-none text-base font-bold text-gray-800 bg-transparent cursor-pointer">
                {[1, 2, 3, 4, 5, 6].map(x => <option key={x} value={x}>{x} người lớn</option>)}
              </select>
            </div>
            <button onClick={handleSearch} disabled={loading} className="shrink-0 px-10 py-3 text-sm font-bold uppercase tracking-widest text-white rounded-sm disabled:opacity-60" style={{ background: '#00224f' }}>
              {loading ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
          </div>
          {n > 0 && <p className="text-xs text-gray-500 mt-2 font-medium">{n} đêm · {checkIn} → {checkOut}</p>}
        </div>
      </div>

      {/* MAIN */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full pb-32">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
              {searched ? `${enriched.length} hạng phòng có sẵn` : 'Tất cả hạng phòng'}
            </h1>
            {!searched && <p className="text-sm text-gray-500 mt-0.5">Nhập ngày để xem phòng trống và giá tốt nhất</p>}
          </div>
          {searched && <button onClick={() => setSearched(false)} className="text-sm underline text-gray-500 hover:text-gray-800">Xem tất cả</button>}
        </div>

        {error && <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm">{error}</div>}

        {searched && !loading && enriched.length === 0 && (
          <div className="py-24 text-center bg-white border border-gray-200">
            <p className="text-xl font-bold text-gray-700 mb-2">Không còn phòng trống</p>
            <p className="text-gray-500 text-sm mb-4">Vui lòng chọn ngày khác.</p>
            <button onClick={() => setSearched(false)} className="text-sm font-bold underline" style={{ color: '#00224f' }}>Thử lại</button>
          </div>
        )}

        <div className="space-y-4">
          {displayList.map((type, idx) => (
            <RoomCard
              key={type.loaiPhongId || idx}
              type={type} idx={idx} searched={searched}
              checkIn={checkIn} nights={n}
              qty={qty[type.loaiPhongId] || 0}
              // 
              onQtyChange={(v, subtotal) => {
                setQty(q => ({ ...q, [type.loaiPhongId]: v }));
                setSubtotals(s => ({ ...s, [type.loaiPhongId]: subtotal })); // NHẬN TIỀN TỪ ROOM CARD GỬI LÊN
              }}
            />
          ))}
        </div>
      </main>

      {/* FLOATING BOOKING BAR – chỉ hiện khi có phòng được chọn */}
      {searched && selectedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 shadow-2xl" style={{ background: '#00224f' }}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-0.5">
                {selectedCount} hạng phòng · {Object.entries(qty).filter(([, v]) => v > 0).reduce((s, [, v]) => s + v, 0)} phòng · {n} đêm
              </p>
              <p className="text-2xl font-black" style={{ color: '#c9a84c' }}>{fmtVD(grandTotal)}</p>
              <p className="text-xs text-white/40 mt-0.5">100% tiền phòng (thanh toán đầy đủ)</p>
            </div>
            <button onClick={handleConfirmBooking}
              className="shrink-0 px-10 py-4 rounded-lg text-sm font-black uppercase tracking-widest transition hover:opacity-90"
              style={{ background: '#c9a84c', color: '#00224f' }}>
              Xác nhận đặt phòng →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RoomCard({ type, idx, searched, checkIn, nights, qty, onQtyChange }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [showCal, setShowCal] = useState(false);
  const [calStart, setCalStart] = useState(0);
  const [realCalData, setRealCalData] = useState([]);
  const [loadingCal, setLoadingCal] = useState(false);

  const imgs = [type.anhDaiDien, FALLBACK[idx % FALLBACK.length], FALLBACK[(idx + 1) % FALLBACK.length]].filter(Boolean);
  const ppn = type.pricePerNight || 0;
  const available = type.availableCount; // null nếu chưa search
  const maxQty = searched ? Math.min(10, available || 0) : 10;
  const outOfStock = searched && available === 0;
  const isLow = searched && available !== null && available > 0 && available <= 3;
  // ─── Tính giá dựa trên lịch giá đã qua policy ────────────────────────────
  // pricesReady: realCalData đã load đủ số ngày của kỳ nghỉ
  const pricesReady = realCalData.length >= nights && nights > 0;

  // totalOneRoom = tổng giá 1 phòng cho nights đêm (dùng giá từng ngày sau khi áp policy)
  const totalOneRoom = pricesReady
    ? realCalData.slice(0, nights).reduce((sum, day) => sum + day.price, 0)
    : ppn * nights; // fallback giá gốc khi đang tải

  // Tổng tiền cho qty phòng đã chọn (dùng cho subtotal hiển thị trong card)
  const roomSubtotal = totalOneRoom * qty;

  // Giá trung bình mỗi đêm sau khi áp policy (dùng để hiển thị "₫ X / đêm")
  const effectivePPN = pricesReady && nights > 0 ? Math.round(totalOneRoom / nights) : ppn;

  // Badge "Giá ưu đãi" nếu có ít nhất 1 ngày bị điều chỉnh bởi policy
  const hasPolicyApplied = pricesReady && realCalData.slice(0, nights).some(d => d.isModified);

  const visibleCal = (realCalData.length > 0 ? realCalData : priceCalendar(checkIn || today(), ppn)).slice(calStart, calStart + 5);


  // ─── FIX: Fetch giá NGAY KHI có kết quả tìm kiếm (không đợi mở lịch) ──────
  // Lý do: nếu chỉ fetch khi showCal=true, user chọn qty trước khi mở lịch
  // thì totalOneRoom tính bằng ppn * nights (giá gốc), bỏ qua hoàn toàn pricing policy.
  useEffect(() => {
    // Chỉ fetch khi đã có kết quả search, có loaiPhongId, và có ngày hợp lệ
    if (!searched || !type.loaiPhongId || !checkIn || nights <= 0) return;

    const fetchPricingCalendar = async () => {
      setLoadingCal(true);
      try {
        const start = checkIn;
        // FIX: fetch đủ ngày để bao phủ toàn bộ kỳ nghỉ (không cứng 7 ngày)
        // Lấy max(7, nights+1) để calendar 7 ngày vẫn đẹp, nhưng totalOneRoom không bị thiếu giá
        const daysNeeded = Math.max(7, nights + 1);
        const end = addD(start, daysNeeded);

        const res = await pricingService.getListPrice(
          new Date(start).toISOString(),
          new Date(end).toISOString(),
          type.loaiPhongId
        );

        const apiData = res.data || [];
        const roomPricingData = apiData.find(item => item.loaiPhongId === type.loaiPhongId) || apiData[0];
        const priceDetails = roomPricingData?.priceDetails || [];

        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

        const generatedCal = Array.from({ length: daysNeeded }, (_, i) => {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          const dow = d.getDay();

          const matchedItem = priceDetails.find(item =>
            item.date && item.date.startsWith(dateStr)
          );

          const finalPrice = matchedItem ? matchedItem.actualPrice : ppn;
          const isModified = matchedItem && matchedItem.appliedPolicies && matchedItem.appliedPolicies.length > 0;

          return {
            date: dateStr,
            label: `${days[dow]} ${d.getDate()}/${d.getMonth() + 1}`,
            price: finalPrice,
            wd: dow === 0 || dow === 6,
            isModified,
            policyNames: isModified ? matchedItem.appliedPolicies.join(', ') : '',
          };
        });

        setRealCalData(generatedCal);
      } catch (error) {
        console.error('[PriceCalendar] Lỗi tải giá động:', error);
        // Fallback: dùng priceCalendar với đủ ngày
        const daysNeeded = Math.max(7, nights + 1);
        const fallback = Array.from({ length: daysNeeded }, (_, i) => {
          const d = new Date(checkIn); d.setDate(d.getDate() + i);
          const dow = d.getDay(); const wd = dow === 0 || dow === 6;
          const days2 = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
          return { date: d.toISOString().split('T')[0], label: `${days2[dow]} ${d.getDate()}/${d.getMonth() + 1}`, price: wd ? Math.round(ppn * 1.22) : ppn, wd, isModified: false, policyNames: '' };
        });
        setRealCalData(fallback);
      } finally {
        setLoadingCal(false);
      }
    };

    fetchPricingCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searched, checkIn, type.loaiPhongId, ppn, nights]);

  // ─── FIX: Khi realCalData load xong, notify parent nếu qty đang > 0 ────────
  // Lý do: user có thể đã chọn qty trong lúc giá chưa load xong (realCalData=[]).
  // Khi giá real load xong, subtotal cũ ở parent vẫn = ppn*nights*qty (sai).
  // Effect này đảm bảo parent luôn nhận subtotal đúng theo giá có policy.
  useEffect(() => {
    if (qty > 0 && realCalData.length >= nights && nights > 0) {
      const newTotalOneRoom = realCalData.slice(0, nights).reduce((s, d) => s + d.price, 0);
      onQtyChange(qty, newTotalOneRoom * qty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realCalData]);


  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Banner */}
      {(outOfStock || isLow) && (
        <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-3" style={{ background: '#fff7f0' }}>
          {outOfStock && <span className="text-xs font-bold text-gray-500">Hết phòng trong khoảng thời gian này</span>}
          {isLow && !outOfStock && <span className="text-xs font-bold text-red-600">⚡ Chỉ còn {available} phòng! Đặt ngay trước khi hết.</span>}
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        {/* Ảnh */}
        <div className="w-full md:w-[260px] shrink-0">
          <div className="relative h-52 overflow-hidden cursor-pointer group"
            onClick={() => setImgIdx((imgIdx + 1) % Math.max(imgs.length, 1))}>
            <img src={imgs[imgIdx] || FALLBACK[idx % FALLBACK.length]} alt={type.tenLoaiPhong}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700"
              onError={e => { e.target.src = FALLBACK[idx % FALLBACK.length]; }}
            />
            {imgs.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {imgs.map((_, i) => <button key={i} onClick={e => { e.stopPropagation(); setImgIdx(i); }} className="w-1.5 h-1.5 rounded-full" style={{ background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)' }} />)}
              </div>
            )}
          </div>
          <p className="text-center text-xs text-gray-400 py-1.5 bg-gray-50 border-t border-gray-100">Nhấn để xem thêm</p>
        </div>

        {/* Thông tin */}
        <div className="flex-1 p-6 border-r border-gray-100 flex flex-col justify-between min-w-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>{type.tenLoaiPhong}</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">{type.moTa}</p>
            <div className="flex gap-2 mb-4">
              {['🌿', '📶', '❄️'].map((ic, i) => <span key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white" style={{ background: '#22c55e' }}>{ic}</span>)}
              <span className="text-xs text-blue-600 underline decoration-dotted self-center ml-1 cursor-pointer">xem tất cả tiện nghi</span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600 font-medium">
              <span>🛏 {idx % 2 === 0 ? '1 giường King' : '2 giường đơn'}</span>
              <span>📐 {(type.soNguoiToiDa || 2) * 15}m²</span>
              <span>👥 {type.soNguoiToiDa || 2} người</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100 text-xs font-semibold text-green-700">
            <span>✓ Miễn phí hủy phòng</span>
            <span className="text-gray-200">·</span>
            <span>✓ Bữa sáng bao gồm</span>
          </div>
        </div>

        {/* Giá + Số phòng + Đặt */}
        <div className="w-full md:w-[210px] shrink-0 p-5 flex flex-col justify-between" style={{ background: '#fafafa' }}>
          <div>
            {/* ✅ Hiển thị số phòng còn lại */}
            {searched && available !== null && (
              <div className="mb-3">
                <span className="text-xs font-bold px-3 py-1.5 rounded-sm"
                  style={{
                    background: outOfStock ? '#fee2e2' : isLow ? '#fff7ed' : '#f0fdf4',
                    color: outOfStock ? '#dc2626' : isLow ? '#c2410c' : '#15803d',
                  }}>
                  {outOfStock ? 'Hết phòng' : `Còn ${available} phòng`}
                </span>
              </div>
            )}

            {ppn > 0 && (
              <>
                {/* Hiển thị giá sau khi áp policy (effectivePPN) thay vì giá gốc ppn */}
                <div className="mb-0.5">
                  {loadingCal && searched ? (
                    // Đang tải giá thực tế
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="w-3 h-3 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-[10px] text-amber-500 font-semibold">Đang tải giá...</span>
                    </div>
                  ) : hasPolicyApplied ? (
                    // Có chính sách giá → hiện giá gốc bị gạch + badge ưu đãi
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] text-gray-400 line-through">₫{fmt(ppn)}</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                        style={{ background: '#dcfce7', color: '#166534' }}>ƯU ĐÃI</span>
                    </div>
                  ) : null}
                  <p className="text-2xl font-black leading-none" style={{ color: '#c9a84c' }}>
                    ₫ {fmt(effectivePPN)}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mb-3">/ phòng / đêm{!pricesReady && searched ? ' (ước tính)' : ''}</p>
              </>
            )}

            {/* Hiển thị subtotal khi đã chọn qty */}
            {qty > 0 && nights > 0 && ppn > 0 && (
              <div className="rounded-sm px-3 py-2.5 mb-3 text-xs" style={{ background: '#fef9f0', border: '1px solid #f59e0b' }}>
                <p className="text-amber-700 font-semibold">{qty} phòng × {nights} đêm</p>
                <p className="text-amber-800 font-black text-sm mt-0.5">= {fmtVD(roomSubtotal)}</p>
              </div>
            )}

            {/* ✅ Qty selector: 0-10, max = availableCount khi đã search */}
            <div className="mb-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Số phòng
                {searched && available !== null && (
                  <span className="normal-case font-normal text-gray-400"> (tối đa {maxQty})</span>
                )}
              </label>
              <select
                value={qty}
                onChange={e => {
                  const newQty = Number(e.target.value);
                  onQtyChange(newQty, totalOneRoom * newQty); // ĐẨY CẢ SỐ LƯỢNG VÀ TỔNG TIỀN LÊN TRÊN
                }}
                disabled={outOfStock}
                className="w-full text-sm border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-gray-400 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {/* qty=0 → hiển thị nhưng disable nút đặt */}
                <option value={0}>0 phòng</option>
                {Array.from({ length: searched ? maxQty : 10 }, (_, i) => i + 1).map(x => (
                  <option key={x} value={x}>{x} phòng</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            {/* ✅ Nút "Thêm vào giỏ" – chỉ active khi qty > 0 và còn phòng */}
            <button
              disabled={outOfStock || qty === 0}
              onClick={() => { }}
              title={qty === 0 ? 'Chọn số phòng để thêm vào giỏ' : ''}
              className="w-full py-3 text-sm font-bold uppercase tracking-widest text-white rounded-sm mb-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: qty > 0 && !outOfStock ? '#00224f' : '#9ca3af' }}>
              {outOfStock ? 'Hết phòng' : qty === 0 ? 'Chọn số phòng ↑' : `✓ Đã chọn ${qty} phòng`}
            </button>

            <button onClick={() => setShowCal(!showCal)}
              className="w-full text-[11px] font-semibold text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
              📅 {showCal ? 'Ẩn lịch giá' : 'Xem lịch giá'}
            </button>
          </div>
        </div>
      </div>

      {/* Price calendar */}

      {showCal && ppn > 0 && (
        <div className="border-t border-gray-100 px-5 py-4" style={{ background: '#fafafa' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Giá theo ngày {loadingCal && <span className="normal-case font-normal text-blue-500 italic ml-2">(Đang tải...)</span>}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setCalStart(Math.max(0, calStart - 1))} disabled={calStart === 0} className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-30">‹</button>
              <button onClick={() => setCalStart(Math.min(2, calStart + 1))} disabled={calStart >= 2} className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-30">›</button>
            </div>
          </div>

          <div className="flex gap-2">
            {visibleCal.map((day, i) => {
              const sel = day.date === checkIn;
              return (
                <div key={i} className="flex-1 rounded-sm border text-center py-2 cursor-pointer relative"
                  style={{
                    borderColor: sel ? '#00224f' : day.wd ? '#fde68a' : '#e5e7eb',
                    background: sel ? '#00224f' : day.wd ? '#fffbeb' : '#fff'
                  }}>
                  {/* Hiển thị Thứ & Ngày */}
                  <p className="text-[9px] font-bold mb-1" style={{ color: sel ? '#c9a84c' : '#6b7280' }}>
                    {day.label}
                  </p>

                  {/* Khung chứa giá gốc (giữ chiều cao cố định 14px để các ô lịch không bị xô lệch) */}
                  <div className="h-[14px] flex items-center justify-center mb-0.5">
                    {day.isModified && (
                      <p className="text-[10px] line-through font-semibold" style={{ color: sel ? '#fca5a5' : '#ef4444' }}>
                        ₫{fmt(ppn)}
                      </p>
                    )}
                  </div>

                  {/* Giá thực tế (được phóng to thành text-xs, tương đương 12px) */}
                  <p className="text-xsmax font-black" style={{ color: sel ? '#fff' : '#c9a84c' }}>
                    ₫{fmt(day.price)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}