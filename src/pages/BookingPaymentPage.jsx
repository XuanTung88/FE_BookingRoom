import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

// ─── Helpers ──────────────────────────────────────────────────────
const fmt  = (n) => n ? new Intl.NumberFormat('vi-VN').format(n) + ' ₫' : '0 ₫';
const fmtD = (s) => s
  ? new Date(s).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
  : '—';

const BANK = { bank: 'MBBank', account: '0929959586', owner: 'LUU XUAN TUNG' };

const qrUrl = ({ bank, account, amount, content }) =>
  `https://img.vietqr.io/image/${bank}-${account}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent('HOTEL MONLIGHT LUXURY')}`;

// ─── Component ────────────────────────────────────────────────────
export default function BookingPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const s        = location.state || {};

  // ĐÃ FIX: Nhận đúng biến grandTotal và selectedRooms từ BookingConfirmPage
  const { bookingId, checkIn, checkOut, roomType, total = 0, grandTotal = 0, selectedRooms = [] } = s;
  
  // Hỗ trợ cả 2 chuẩn biến (cũ/mới) để không bao giờ bị 0đ
  const finalTotal = grandTotal || total;
  const deposit  = Math.round(finalTotal * 1);
  const content  = `DP${bookingId ? bookingId.toString().slice(-5).toUpperCase() : '12345'}`;

  // Gom nhóm tên các phòng đã chọn để hiển thị (VD: Suite Thương gia, Standard)
  const roomTypeDisplay = selectedRooms.length > 0 
    ? [...new Set(selectedRooms.map(r => r.loaiPhong))].join(', ') 
    : (roomType?.tenLoaiPhong || '—');

  const [copied, setCopied]       = useState({ account: false, content: false });
  const [confirming, setConfirming] = useState(false);
  const [done, setDone]           = useState(false);

  const copy = async (field, text) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(p => ({ ...p, [field]: true }));
    setTimeout(() => setCopied(p => ({ ...p, [field]: false })), 2000);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    await new Promise(r => setTimeout(r, 1500));
    setDone(true);
    setConfirming(false);
    setTimeout(() => navigate('/booking/history'), 4000);
  };

  // ── Success screen ────────────────────────────────────────────
  if (done) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f6f8' }}>
      <div className="max-w-md w-full mx-4 bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden text-center">
        <div className="py-10 px-8 border-b border-gray-100">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: '#f0fdf4' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" className="w-10 h-10">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Đặt phòng thành công!
          </h2>
          <p className="text-gray-500 text-sm mb-2">
            Mã đặt phòng của bạn:
          </p>
          <p className="text-xl font-black tracking-widest mb-4" style={{ color: '#00224f' }}>
            #{bookingId?.toString().slice(-8).toUpperCase() || 'XXXXXXXX'}
          </p>
          <p className="text-sm text-gray-500">
            Đội ngũ của chúng tôi sẽ liên hệ xác nhận trong vòng 30 phút. Đang chuyển về lịch sử đặt phòng...
          </p>
        </div>
        <div className="flex divide-x divide-gray-100">
          <button onClick={() => navigate('/booking/history')}
            className="flex-1 py-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Xem lịch sử
          </button>
          <button onClick={() => navigate('/')}
            className="flex-1 py-4 text-sm font-bold text-white transition"
            style={{ background: '#c9a84c' }}>
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );

  // ── Guard ─────────────────────────────────────────────────────
  if (!bookingId && !finalTotal) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f6f8' }}>
      <div className="text-center">
        <p className="text-gray-500 mb-4">Không tìm thấy thông tin thanh toán.</p>
        <button onClick={() => navigate('/booking')}
          className="px-6 py-2.5 text-sm font-bold text-white rounded-sm"
          style={{ background: '#00224f' }}>
          Quay lại đặt phòng
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f5f6f8', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold" style={{ color: '#00224f', fontFamily: 'Georgia, serif' }}>
            Hotel<span style={{ color: '#c9a84c' }}>Moonlight</span>
          </Link>
          {/* Progress steps */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
            {['Tìm phòng','Xác nhận','Thanh toán'].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: i <= 2 ? '#00224f' : '#e5e7eb', color: i <= 2 ? '#fff' : '#9ca3af' }}>
                    {i + 1}
                  </div>
                  <span style={{ color: i <= 2 ? '#00224f' : '#9ca3af' }}>{step}</span>
                </div>
                {i < 2 && <div className="w-8 h-px" style={{ background: '#00224f' }}/>}
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Concierge</span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            Phương thức thanh toán
          </h1>
          <p className="text-sm text-gray-500">Chuyển khoản đúng nội dung để hệ thống xác nhận tự động.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── LEFT: QR + Bank info ─────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Method selector (chỉ có VietQR) */}
            <div className="flex gap-3 mb-6">
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-sm border-2 cursor-default"
                style={{ borderColor: '#c9a84c', background: '#fffbeb' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" className="w-5 h-5 shrink-0">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <rect x="14" y="14" width="2" height="2"/><rect x="17" y="14" width="2" height="2"/>
                  <rect x="14" y="17" width="2" height="2"/><rect x="17" y="17" width="2" height="2"/>
                </svg>
                <span className="text-sm font-bold tracking-widest" style={{ color: '#c9a84c' }}>VIETQR</span>
              </div>
            </div>

            {/* QR Card */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
              {/* QR Code */}
              <div className="flex flex-col items-center py-8 px-6 border-b border-gray-100">
                <div className="w-52 h-52 rounded-sm overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                  <img
                    src={qrUrl({ bank: 'mbbank', account: BANK.account, amount: deposit, content })}
                    alt="VietQR"
                    className="w-full h-full object-contain"
                    onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                  />
                  <div className="hidden flex-col items-center justify-center text-gray-300 text-xs text-center p-4">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-16 h-16 mb-2 opacity-40">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                    </svg>
                    Mã QR tạm thời không khả dụng.<br/>Vui lòng nhập tay thông tin bên dưới.
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Quét mã bằng ứng dụng ngân hàng bất kỳ
                </p>
              </div>

              {/* Bank rows */}
              <div className="p-5 space-y-3">
                <BankRow label="Ngân hàng"      value={BANK.bank} />
                <BankRow label="Số tài khoản"   value={BANK.account}
                  onCopy={() => copy('account', BANK.account)} copied={copied.account} />
                <BankRow label="Chủ tài khoản"  value={BANK.owner} />
                <BankRow label="Số tiền"        value={`${new Intl.NumberFormat('vi-VN').format(deposit)} ₫`} highlight />
                <BankRow label="Nội dung CK"    value={content}
                  onCopy={() => copy('content', content)} copied={copied.content} highlight />
              </div>

              <div className="mx-5 mb-5 p-3 rounded-sm text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200">
                ⚠️ Vui lòng nhập <strong>đúng nội dung chuyển khoản</strong> để hệ thống xác nhận tự động. Sai nội dung có thể gây chậm trễ xử lý.
              </div>
            </div>
          </div>

          {/* ── RIGHT: Booking summary ──────────────────────── */}
          <div className="w-full lg:w-[320px] shrink-0">
            <div className="rounded-sm overflow-hidden sticky top-24" style={{ background: '#00224f' }}>

              <div className="px-6 py-5 border-b border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#c9a84c' }}>
                  Chi tiết đặt phòng
                </h3>
              </div>

              <div className="px-6 py-5 space-y-4">
                <SummaryRow label="Loại phòng" value={roomTypeDisplay} />
                <SummaryRow label="Ngày nhận"  value={fmtD(checkIn)} />
                <SummaryRow label="Ngày trả"   value={fmtD(checkOut)} />
                <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Tổng cộng</span>
                  <span className="text-base font-bold" style={{ color: '#c9a84c' }}>{fmt(finalTotal)}</span>
                </div>
              </div>

              {/* Deposit highlight */}
              <div className="mx-4 mb-4 rounded-sm px-5 py-5 text-center"
                style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Số tiền đặt cọc (50%)
                </p>
                <p className="text-3xl font-black leading-none" style={{ color: '#c9a84c' }}>
                  {new Intl.NumberFormat('vi-VN').format(deposit)}
                </p>
                <p className="text-base font-bold mt-0.5" style={{ color: '#c9a84c' }}>₫</p>
              </div>

              <div className="px-4 pb-6">
                <button onClick={handleConfirm} disabled={confirming}
                  className="w-full py-4 text-sm font-bold uppercase tracking-widest rounded-sm transition disabled:opacity-60"
                  style={{ background: '#c9a84c', color: '#00224f' }}>
                  {confirming ? 'Đang xử lý...' : 'Xác nhận & Thanh toán cọc'}
                </button>
                <p className="text-[10px] text-center mt-3 font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Nhấn sau khi đã chuyển khoản thành công
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function BankRow({ label, value, onCopy, copied, highlight }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-sm border"
      style={{ borderColor: highlight ? '#f59e0b' : '#f3f4f6', background: highlight ? '#fffbeb' : '#fafafa' }}>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-bold" style={{ color: highlight ? '#92400e' : '#1f2937' }}>{value}</p>
      </div>
      {onCopy && (
        <button onClick={onCopy}
          className="ml-4 shrink-0 p-2 rounded-sm transition border"
          style={{
            borderColor: copied ? '#c9a84c' : '#e5e7eb',
            color      : copied ? '#c9a84c' : '#9ca3af',
            background : copied ? '#fffbeb' : '#fff',
          }}>
          {copied
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <rect x="9" y="9" width="13" height="13" rx="1"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
          }
        </button>
      )}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      <span className="text-sm font-semibold text-white text-right max-w-[160px] leading-snug">{value}</span>
    </div>
  );
}