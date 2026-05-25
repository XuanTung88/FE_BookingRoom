import { useState, useEffect } from 'react';
import { submitCheckin, fetchInvoiceDetails, fetchBookingDetails, splitInvoice, confirmCheckout, fetchAllServices, addServiceToRoom } from '../../api/bookingService';

export default function BookingDrawer({ selectedBooking, setSelectedBooking, activeTab, setActiveTab, rooms, onRefresh, openCheckinFormDirectly }) {
    const [guests, setGuests] = useState([]);
    const [newGuest, setNewGuest] = useState({ fullName: '', cccd: '', nationality: 'Việt Nam' });
    const [isCheckinMode, setIsCheckinMode] = useState(false);

    const [invoice, setInvoice] = useState(null);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const [billMode, setBillMode] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');

    // STATE DỊCH VỤ
    const [availableServices, setAvailableServices] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [serviceQuantity, setServiceQuantity] = useState(1);
    const [isAddingService, setIsAddingService] = useState(false);

    // STATE CHO POPUP THÔNG BÁO TÙY CHỈNH
    const [notify, setNotify] = useState({ isOpen: false, message: '', type: 'success', onConfirm: null });

    const LE_TAN_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

    useEffect(() => {
        if (selectedBooking) {
            setGuests([]);
            setNewGuest({ fullName: '', cccd: '', nationality: 'Việt Nam' });
            setIsCheckinMode(openCheckinFormDirectly || false);
            setBillMode(null);

            loadServicesList();

            if (activeTab === 'checkout' || activeTab === 'services') {
                loadCheckoutData();
            }
        }
    }, [selectedBooking, activeTab, openCheckinFormDirectly]);

    const loadServicesList = async () => {
        try {
            const svcs = await fetchAllServices();
            setAvailableServices(svcs || []);
            if (svcs && svcs.length > 0) {
                setSelectedServiceId(svcs[0].id);
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách dịch vụ", error);
        }
    };

    const loadCheckoutData = async () => {
        setLoadingCheckout(true);
        try {
            const [invData, detailData] = await Promise.all([
                fetchInvoiceDetails(selectedBooking.id).catch(() => null),
                fetchBookingDetails(selectedBooking.id).catch(() => null)
            ]);
            setInvoice(invData);
            setBookingDetails(detailData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingCheckout(false);
        }
    };

    const showNotification = (message, type = 'success', onConfirm = null) => {
        setNotify({ isOpen: true, message, type, onConfirm });
    };

    const handleCloseNotify = () => {
        const { onConfirm } = notify;
        setNotify({ ...notify, isOpen: false });
        if (onConfirm) onConfirm();
    };

    if (!selectedBooking) return null;

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    const formatDate = (dateObj) => dateObj ? `${new Date(dateObj).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(dateObj).toLocaleDateString('vi-VN')}` : 'Chưa cập nhật';
    const formatCheckOutDate = (dateObj) => dateObj ? new Date(dateObj).toLocaleDateString('vi-VN') : 'N/A';

    const handleAddService = async () => {
        if (!selectedServiceId || serviceQuantity < 1) return;
        setIsAddingService(true);
        try {
            const svc = availableServices.find(s => s.id === selectedServiceId);
            const payload = {
                chiTietDatPhongId: selectedBooking.chiTietDatPhongId,
                dichVuId: selectedServiceId,
                soLuong: serviceQuantity,
                thanhTien: svc.gia * serviceQuantity
            };

            await addServiceToRoom(payload);
            showNotification(`Đã thêm ${serviceQuantity}x ${svc.tenDichVu} thành công!`, 'success');

            await loadCheckoutData();
            setServiceQuantity(1);
        } catch (error) {
            showNotification("Lỗi khi thêm dịch vụ. Vui lòng thử lại!", 'error');
        } finally {
            setIsAddingService(false);
        }
    };

    const handleAddGuest = () => {
        if (newGuest.fullName && newGuest.cccd) {
            setGuests([...guests, newGuest]);
            setNewGuest({ fullName: '', cccd: '', nationality: 'Việt Nam' });
        } else {
            showNotification("Vui lòng nhập ít nhất Họ tên và CCCD!", 'error');
        }
    };

    const handleConfirmCheckin = async () => {
        if (guests.length === 0) {
            showNotification("Vui lòng thêm ít nhất 1 khách lưu trú!", 'error');
            return;
        }

        try {
            await submitCheckin(selectedBooking.id, selectedBooking.chiTietDatPhongId, guests);
            showNotification("Check-in thành công!", 'success', () => {
                if (onRefresh) onRefresh();
                setSelectedBooking(null);
            });
        } catch (error) {
            showNotification("Có lỗi xảy ra khi Check-in.", 'error');
        }
    };

    const handleExecutePayment = async () => {
        try {
            if (billMode === 'split') {
                const splitRes = await splitInvoice(selectedBooking.id, selectedBooking.chiTietDatPhongId, LE_TAN_ID);
                const newId = splitRes.NewHoaDonId || splitRes.newHoaDonId || splitRes;
                await confirmCheckout(newId, paymentMethod, LE_TAN_ID);
            } else {
                await confirmCheckout(selectedBooking.id, paymentMethod, LE_TAN_ID);
            }
            showNotification("Thanh toán thành công!", 'success', () => {
                if (onRefresh) onRefresh();
                setSelectedBooking(null);
            });
        } catch (error) {
            showNotification("Đã xảy ra lỗi khi thanh toán.", 'error');
        }
    };

    const renderRoomList = () => {
        const roomList = bookingDetails?.phongs || invoice?.danhSachPhong || [{
            soPhong: rooms.find(r => r.id === selectedBooking.roomId)?.soPhong || 'N/A',
            gia: selectedBooking.price
        }];

        return roomList.map((r, i) => (
            <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 mb-2">
                <span className="font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path></svg>
                    Phòng {r.soPhong}
                </span>
                <span className="font-semibold text-blue-600">{formatCurrency(r.gia || r.giaThucTe || selectedBooking.price)}</span>
            </div>
        ));
    };

    const tienPhong = invoice?.tienPhong || selectedBooking.price;
    const tienDichVu = invoice?.tienDichVu || 0;
    const tienDenBu = invoice?.tienDenBu || 0;
    const tienDaCoc = invoice?.tienDaCoc || 0;

    return (
        <>
            <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedBooking(null)}></div>

            <div className="fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 transform transition-transform flex flex-col animate-slide-in-right">

                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-sm">
                            PHÒNG {rooms.find(r => r.id === selectedBooking.roomId)?.soPhong || 'N/A'}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${(selectedBooking.status === 'Chuẩn bị' || selectedBooking.status === 'Chờ xác nhận') ? 'bg-emerald-100 text-emerald-700' :
                                (selectedBooking.status === 'Đang ở' || selectedBooking.status === 'Đã nhận phòng') ? 'bg-blue-100 text-blue-700' :
                                    (selectedBooking.status === 'Đã trả phòng' || selectedBooking.status === 'Hoàn tất') ? 'bg-gray-100 text-gray-700' :
                                        'bg-orange-100 text-orange-700'
                            }`}>
                            {selectedBooking.status}
                        </span>
                    </div>
                    <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-800 transition p-2 hover:bg-gray-200 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {!isCheckinMode && !billMode && (
                    <div className="flex px-6 border-b border-gray-100 shrink-0">
                        {['info', 'services', 'checkout'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                {tab === 'info' ? 'Chi tiết' : tab === 'services' ? 'Dịch vụ' : 'Check-out'}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">

                    {/* TAB: THÔNG TIN CHI TIẾT */}
                    {activeTab === 'info' && !isCheckinMode && !billMode && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Thông tin tài khoản đặt phòng</h4>
                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-sm space-y-4">
                                    <div className="grid grid-cols-3 gap-2 border-b border-gray-50 pb-3">
                                        <span className="text-gray-500 col-span-1">Mã đặt phòng:</span>
                                        <span className="font-bold text-blue-600 col-span-2 text-right">{selectedBooking.id}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-b border-gray-50 pb-3">
                                        <span className="text-gray-500 col-span-1">Tên người đặt:</span>
                                        <span className="font-semibold text-gray-900 col-span-2 text-right">{selectedBooking.guestName}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-b border-gray-50 pb-3">
                                        <span className="text-gray-500 col-span-1">Số điện thoại:</span>
                                        <span className="font-semibold text-gray-900 col-span-2 text-right">{selectedBooking.phone || 'Chưa cập nhật'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-b border-gray-50 pb-3">
                                        <span className="text-gray-500 col-span-1">CCCD/Passport:</span>
                                        <span className="font-semibold text-gray-900 col-span-2 text-right">{selectedBooking.cccd || 'Chưa cập nhật'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-b border-gray-50 pb-3">
                                        <span className="text-gray-500 col-span-1">Dự kiến Check-in:</span>
                                        <span className="font-semibold text-gray-900 col-span-2 text-right text-emerald-600">{formatDate(selectedBooking.checkIn)}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-b border-gray-50 pb-3">
                                        <span className="text-gray-500 col-span-1">Dự kiến Check-out:</span>
                                        <span className="font-semibold text-gray-900 col-span-2 text-right text-orange-600">{formatCheckOutDate(selectedBooking.checkOut)}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 pt-1">
                                        <span className="text-gray-500 col-span-1 font-semibold">Tiền phòng:</span>
                                        <span className="font-bold text-blue-700 col-span-2 text-right text-base">{formatCurrency(selectedBooking.price)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FORM CHECK-IN */}
                    {activeTab === 'info' && isCheckinMode && (
                        <div className="animate-slide-in-right">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-gray-800 uppercase">Khai báo khách lưu trú</h4>
                                <button onClick={() => setIsCheckinMode(false)} className="text-xs font-semibold text-blue-600 hover:underline">
                                    ← Quay lại thông tin
                                </button>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-md mb-5">
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Họ và tên *</label>
                                        <input type="text" value={newGuest.fullName} onChange={e => setNewGuest({ ...newGuest, fullName: e.target.value })} className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="VD: Nguyễn Văn A" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">CCCD / Passport *</label>
                                        <input type="text" value={newGuest.cccd} onChange={e => setNewGuest({ ...newGuest, cccd: e.target.value })} className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Số giấy tờ" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Quốc tịch</label>
                                        <input type="text" value={newGuest.nationality} onChange={e => setNewGuest({ ...newGuest, nationality: e.target.value })} className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                                <button onClick={handleAddGuest} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2.5 rounded-lg text-sm border border-blue-200 transition border-dashed">
                                    + Thêm khách lưu trú
                                </button>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-500">DANH SÁCH KHÁCH ({guests.length}):</p>
                                {guests.length === 0 && <p className="text-xs text-gray-400 italic">Chưa có khách nào được khai báo.</p>}
                                {guests.map((g, idx) => (
                                    <div key={idx} className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex justify-between items-center shadow-sm">
                                        <div>
                                            <p className="text-sm font-bold text-emerald-900">{g.fullName}</p>
                                            <p className="text-xs text-emerald-700 mt-0.5">CCCD: {g.cccd} • {g.nationality}</p>
                                        </div>
                                        <button onClick={() => setGuests(guests.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 bg-white p-1.5 rounded-md shadow-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB: GỌI DỊCH VỤ */}
                    {activeTab === 'services' && !billMode && (
                        <div className="space-y-6 animate-fade-in">
                            {(selectedBooking.status === 'Đang ở' || selectedBooking.status === 'Đã nhận phòng') ? (
                                <>
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
                                        <h4 className="font-bold text-gray-800 text-sm uppercase flex items-center gap-2 border-b border-gray-100 pb-3">
                                            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                            Gọi thêm dịch vụ
                                        </h4>
                                        <div className="space-y-3">
                                            <select
                                                className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 bg-gray-50"
                                                value={selectedServiceId}
                                                onChange={(e) => setSelectedServiceId(e.target.value)}
                                            >
                                                {availableServices.length === 0 && <option value="">Đang tải dịch vụ...</option>}
                                                {availableServices.map(s => (
                                                    <option key={s.id} value={s.id}>{s.tenDichVu} - {formatCurrency(s.gia)}</option>
                                                ))}
                                            </select>
                                            <div className="flex gap-3">
                                                <div className="flex-1 flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                                    <span className="px-4 text-sm text-gray-500 font-medium border-r border-gray-200 bg-gray-100">Số lượng</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full p-3 text-sm text-center outline-none focus:border-blue-500 bg-transparent font-bold"
                                                        value={serviceQuantity}
                                                        onChange={(e) => setServiceQuantity(parseInt(e.target.value) || 1)}
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleAddService}
                                                    disabled={isAddingService || availableServices.length === 0}
                                                    className="px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition shadow-md whitespace-nowrap"
                                                >
                                                    {isAddingService ? 'Đang thêm...' : 'Xác nhận'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {invoice?.chiTietDichVu && invoice.chiTietDichVu.length > 0 && (
                                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                                            <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase">Lịch sử dịch vụ phòng này</h4>
                                            <div className="space-y-2">
                                                {invoice.chiTietDichVu.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                        <div>
                                                            <span className="font-semibold text-gray-800 block">{item.tenDichVu}</span>
                                                            <span className="text-xs text-gray-500">Số lượng: {item.soLuong}</span>
                                                        </div>
                                                        <span className="font-bold text-blue-600">{formatCurrency(item.thanhTien)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-orange-50 border border-orange-100 p-5 rounded-xl text-center shadow-sm">
                                    <svg className="w-12 h-12 text-orange-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    <h4 className="font-bold text-orange-800">Không thể gọi dịch vụ</h4>
                                    <p className="text-sm text-orange-600 mt-1">Phòng chưa được Check-in hoặc đã trả phòng.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: CHECKOUT TỔNG QUAN */}
                    {activeTab === 'checkout' && !billMode && (
                        <div className="space-y-6 animate-fade-in">
                            {loadingCheckout ? (
                                <div className="flex justify-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
                                        <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-2 text-sm uppercase flex items-center gap-2">
                                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                            Tài khoản Đặt phòng
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Họ tên:</span>
                                                <span className="font-semibold text-gray-900">{selectedBooking.guestName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Số điện thoại:</span>
                                                <span className="font-semibold text-gray-900">{selectedBooking.phone || 'Chưa cập nhật'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Mã Booking:</span>
                                                <span className="font-mono text-gray-500 text-xs">{selectedBooking.id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase">Danh sách Phòng</h4>
                                        {renderRoomList()}
                                        <div className="flex justify-between items-center p-4 mt-3 bg-blue-50 border border-blue-100 rounded-xl">
                                            <span className="font-bold text-blue-900">Tổng tiền tất cả phòng:</span>
                                            <span className="font-black text-blue-700 text-xl">{formatCurrency(tienPhong)}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <button onClick={() => setBillMode('total')} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-md transition flex flex-col items-center justify-center">
                                            <span className="text-sm">Thanh toán Tổng</span>
                                            <span className="text-[10px] opacity-90 font-normal">(Toàn bộ các phòng)</span>
                                        </button>
                                        <button onClick={() => setBillMode('split')} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-md transition flex flex-col items-center justify-center">
                                            <span className="text-sm">Tách Bill riêng</span>
                                            <span className="text-[10px] opacity-90 font-normal">(Chỉ phòng {rooms.find(r => r.id === selectedBooking.roomId)?.soPhong})</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* HÓA ĐƠN CHI TIẾT */}
                    {billMode && invoice && (() => {
                        const isTotal = billMode === 'total';
                        const hienThiTienPhong = isTotal ? tienPhong : selectedBooking.price;
                        const hienThiDichVu = invoice.tienDichVu || 0;
                        const hienThiDenBu = invoice.tienDenBu || 0; // Đã thêm lấy tiền đền bù
                        const hienThiTienCoc = isTotal ? tienDaCoc : (tienDaCoc >= selectedBooking.price ? selectedBooking.price : 0);

                        // CỘNG THÊM TIỀN ĐỀN BÙ VÀO TỔNG THANH TOÁN
                        const tongCanThanhToan = Math.max(0, (hienThiTienPhong + hienThiDichVu + hienThiDenBu) - hienThiTienCoc);

                        return (
                            <div className="animate-slide-in-right space-y-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-gray-800 text-sm uppercase">
                                        {isTotal ? 'Xác nhận Bill Tổng' : `Xác nhận Bill Phòng ${rooms.find(r => r.id === selectedBooking.roomId)?.soPhong}`}
                                    </h4>
                                    <button onClick={() => setBillMode(null)} className="text-xs font-semibold text-blue-600 hover:underline">← Quay lại</button>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                    <div className="bg-gray-800 p-4 text-center">
                                        <p className="text-white font-bold text-sm tracking-widest">HÓA ĐƠN THANH TOÁN</p>
                                        <p className="text-gray-400 text-[10px] mt-1">Lễ tân thực hiện: {LE_TAN_ID}</p>
                                    </div>
                                    <div className="p-5 space-y-3">
                                        <div className="flex justify-between text-sm border-b border-dashed border-gray-100 pb-2">
                                            <span className="text-gray-600 font-medium">Tiền phòng:</span>
                                            <span className="font-bold">{formatCurrency(hienThiTienPhong)}</span>
                                        </div>

                                        <div className="flex justify-between text-sm border-b border-dashed border-gray-100 pb-2 pt-2">
                                            <span className="text-gray-600 font-medium">Dịch vụ phát sinh:</span>
                                            <span className="font-bold text-orange-600">{formatCurrency(hienThiDichVu)}</span>
                                        </div>

                                        {/* HIỂN THỊ TIỀN ĐỀN BÙ VÀO BILL */}
                                        {/* PHÍ TÀI SẢN / ĐỀN BÙ (LUÔN HIỂN THỊ) */}
                                        <div className="flex justify-between text-sm border-b border-dashed border-gray-100 pb-2 pt-2">
                                            <span className="text-gray-600 font-medium">Phí đền bù hư hại:</span>
                                            <span className={`font-bold ${hienThiDenBu > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                {formatCurrency(hienThiDenBu)}
                                            </span>
                                        </div>

                                        {hienThiTienCoc > 0 && (
                                            <div className="flex justify-between text-sm text-emerald-600 pt-2">
                                                <span className="font-medium">Đã đặt cọc / Thanh toán trước:</span>
                                                <span className="font-bold">- {formatCurrency(hienThiTienCoc)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between pt-4 border-t border-gray-200 mt-2">
                                            <span className="font-bold text-gray-900">TỔNG CẦN THANH TOÁN:</span>
                                            <span className={`font-black text-xl ${tongCanThanhToan > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {formatCurrency(tongCanThanhToan)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h5 className="font-bold text-xs text-gray-500 uppercase tracking-wide">Phương thức thanh toán</h5>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div onClick={() => setPaymentMethod('Tiền mặt')} className={`cursor-pointer p-4 border-2 rounded-xl flex items-center justify-center transition ${paymentMethod === 'Tiền mặt' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                                            <span className="text-xl mr-2">💵</span>
                                            <span className="font-bold text-sm">Tiền mặt</span>
                                        </div>
                                        <div onClick={() => setPaymentMethod('Chuyển khoản')} className={`cursor-pointer p-4 border-2 rounded-xl flex items-center justify-center transition ${paymentMethod === 'Chuyển khoản' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                                            <span className="text-xl mr-2">💳</span>
                                            <span className="font-bold text-sm">Chuyển khoản</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* FOOTER BUTTONS */}
                <div className="p-6 bg-white border-t border-gray-100 shrink-0">
                    {activeTab === 'info' && !isCheckinMode && !billMode && (selectedBooking.status === 'Chuẩn bị' || selectedBooking.status === 'Chờ xác nhận' || selectedBooking.status === 'Quá hạn Check-in') && (
                        <button
                            onClick={() => setIsCheckinMode(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition"
                        >
                            Tiến hành Check-in
                        </button>
                    )}

                    {activeTab === 'info' && isCheckinMode && (
                        <button
                            onClick={handleConfirmCheckin}
                            className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition ${guests.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            disabled={guests.length === 0}
                        >
                            Hoàn tất Check-in
                        </button>
                    )}

                    {billMode && (
                        <button
                            onClick={handleExecutePayment}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition text-base flex justify-center items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Hoàn tất Thanh toán
                        </button>
                    )}
                </div>
            </div>

            {/* POPUP THÔNG BÁO TÙY CHỈNH THAY THẾ ALERT */}
            {notify.isOpen && (
                <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center animate-fade-in" onClick={handleCloseNotify}>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-[340px] text-center transform transition-all scale-100 animate-scale-up" onClick={e => e.stopPropagation()}>
                        <div className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full ${notify.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'} mb-4`}>
                            {notify.type === 'success' ? (
                                <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {notify.type === 'success' ? 'Thành công' : 'Thông báo'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">{notify.message}</p>
                        <button
                            onClick={handleCloseNotify}
                            className={`w-full font-bold py-3 rounded-xl transition shadow-md ${notify.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                        >
                            Đồng ý
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}