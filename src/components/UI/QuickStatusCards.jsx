import { useState, useEffect } from 'react';
import apiClient, { ENDPOINTS } from '../../config/api.config';

export default function QuickStatusCards({ onShowCheckinList, bookings = [], rooms = [], onSelectBooking, currentDate }) {
    const [realRooms, setRealRooms] = useState([]);

    const getTokenRole = () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role;
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        const fetchRealRooms = async () => {
            const role = getTokenRole();
            if (role === 'Receptionist' || role === 'Lễ tân') {
                return; // Lễ tân không có quyền gọi API này
            }

            try {
                const response = await apiClient.get(ENDPOINTS.ROOMS);
                if (response.data && response.data.data) {
                    setRealRooms(response.data.data);
                } else if (Array.isArray(response.data)) {
                    setRealRooms(response.data);
                }
            } catch (error) {
                // Nếu Lễ tân không có quyền xem danh sách phòng (403), ta bỏ qua lỗi một cách âm thầm
                if (error.response && error.response.status === 403) {
                    return;
                }
                console.error("Lỗi khi lấy danh sách phòng thực tế:", error);
            }
        };
        fetchRealRooms();

        // Cập nhật lại mỗi 1 phút để giữ real-time
        const interval = setInterval(fetchRealRooms, 60000);
        return () => clearInterval(interval);
    }, []);

    const now = currentDate ? new Date(currentDate) : new Date();

    // 1. Quá hạn trả phòng
    const overdueBookings = bookings.filter(b =>
        b.status === 'Quá hạn trả phòng' ||
        ((b.status === 'Đang ở' || b.status === 'Đã nhận phòng') && new Date(b.checkOut) < now)
    );
    const overdueBooking = overdueBookings.length > 0 ? overdueBookings[0] : null;
    const overdueRoom = overdueBooking ? rooms.find(r => String(r.id) === String(overdueBooking.roomId)) : null;

    // 2. Lịch Check-in hôm nay
    const todayCheckins = bookings.filter(b => {
        const checkinDate = new Date(b.checkIn);
        return (b.status === 'Chuẩn bị' || b.status === 'Chờ xác nhận' || b.status === 'Quá hạn Check-in') &&
            checkinDate.toDateString() === now.toDateString();
    });
    const upcomingCheckin = todayCheckins.length > 0 ? todayCheckins[0] : null;
    const upcomingRoom = upcomingCheckin ? rooms.find(r => String(r.id) === String(upcomingCheckin.roomId)) : null;

    // 3. Trạng thái dọn dẹp (từ API riêng)
    const dirtyRooms = realRooms.filter(r => r.trangThai === 'Trống bẩn' || r.trangThai === 'Đang dọn dẹp');
    const readyRooms = realRooms.filter(r => r.trangThai === 'Sẵn sàng');

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="grid grid-cols-3 gap-6 mt-6 shrink-0">
            {/* Card 1: Quá hạn */}
            {overdueBooking ? (
                <div
                    onClick={() => onSelectBooking && onSelectBooking(overdueBooking)}
                    className="bg-red-50 border border-red-200 rounded-xl p-5 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-red-400 transition active:scale-95"
                    title="Bấm vào để mở Hóa đơn thanh toán ngay!"
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-red-600 uppercase flex items-center gap-1">! Quá hạn trả phòng</span>
                        <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">{overdueBookings.length} PHÒNG</span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Phòng {overdueRoom?.soPhong || '...'}</h4>
                    <p className="text-xs text-gray-600">Khách: {overdueBooking.guestName}<br />Dự kiến trả: {formatTime(overdueBooking.checkOut)}</p>
                </div>
            ) : (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex flex-col justify-between opacity-80">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1">✔ Đúng hạn</span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Tuyệt vời!</h4>
                    <p className="text-xs text-gray-600">Không có phòng nào quá hạn trả.</p>
                </div>
            )}

            {/* Card 2: Check-in mới */}
            <div
                onClick={onShowCheckinList}
                className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-blue-300 transition active:scale-95"
            >
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1">&rarr; Lịch Check-in</span>
                    {todayCheckins.length > 0 && (
                        <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">{todayCheckins.length} LƯỢT</span>
                    )}
                </div>
                {upcomingCheckin ? (
                    <>
                        <h4 className="text-lg font-bold text-gray-900 line-clamp-1">{upcomingCheckin.guestName}</h4>
                        <p className="text-xs text-gray-600">Dự kiến Phòng {upcomingRoom?.soPhong || '...'} • {formatTime(upcomingCheckin.checkIn)}</p>
                    </>
                ) : (
                    <>
                        <h4 className="text-lg font-bold text-gray-900">Trống lịch</h4>
                        <p className="text-xs text-gray-600">Hôm nay không có khách sắp Check-in.</p>
                    </>
                )}
            </div>

            {/* Card 3: Dọn dẹp xong */}
            {dirtyRooms.length > 0 ? (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-orange-600 uppercase flex items-center gap-1">🧹 Chờ dọn dẹp</span>
                        <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">{dirtyRooms.length} PHÒNG</span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Phòng {dirtyRooms[0].soPhong}</h4>
                    <p className="text-xs text-gray-600">Đang chờ nhân viên trực buồng dọn dẹp.</p>
                </div>
            ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1">✨ Hoàn tất</span>
                        <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">{readyRooms.length} PHÒNG</span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Tất cả đã sẵn sàng</h4>
                    <p className="text-xs text-gray-600">Phòng sạch sẽ để đón khách.</p>
                </div>
            )}
        </div>
    );
}