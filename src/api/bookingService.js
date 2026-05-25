import apiClient, { ENDPOINTS } from '../config/api.config';

export const fetchDashboardData = async (startDate, endDate, tangId = '') => {
    try {
        const ganttParams = { startDate, endDate };
        if (tangId) {
            ganttParams.tang = parseInt(tangId);
        }

        const response = await apiClient.get(ENDPOINTS.DASHBOARD_GANTT, { params: ganttParams });

        let rawRooms = response.data?.rooms || [];
        let mappedRooms = rawRooms.map(r => ({
            id: String(r.id),
            soPhong: r.soPhong || '',
            loai: r.loai || 'Chưa xếp loại',
            tang: parseInt(r.tang) || 1
        }));

        let rawBookings = response.data?.bookings || [];
        const now = new Date();

        const mappedBookings = rawBookings.map(b => {
            let currentStatus = b.status || 'Chuẩn bị';
            const expectedCheckIn = new Date(b.checkIn);

            if ((currentStatus === 'Chuẩn bị' || currentStatus === 'Chờ xác nhận') && expectedCheckIn < now) {
                currentStatus = 'Quá hạn Check-in';
            }

            return {
                id: String(b.datPhongId),
                chiTietDatPhongId: String(b.id),
                roomId: String(b.roomId),
                guestName: b.customerName,
                cccd: b.customerCccdpassport || 'Chưa cập nhật',
                phone: b.customerPhone,
                checkIn: expectedCheckIn,
                checkOut: new Date(b.checkOut),
                status: currentStatus,
                color: getColorByStatus(currentStatus),
                price: b.price || 0
            };
        });

        return {
            rooms: mappedRooms,
            bookings: mappedBookings
        };

    } catch (error) {
        return { rooms: [], bookings: [] };
    }
};

const getColorByStatus = (status) => {
    switch (status) {
        case 'Chuẩn bị':
        case 'Chờ xác nhận': return 'bg-emerald-500';
        case 'Đã nhận phòng':
        case 'Đang ở': return 'bg-blue-600';
        case 'Quá hạn':
        case 'Quá hạn Check-in': return 'bg-orange-500';
        case 'Đã đi':
        case 'Hoàn tất': return 'bg-gray-400';
        default: return 'bg-gray-500';
    }
};

export const fetchDailyCheckins = async (dateStr) => {
    try {
        const response = await apiClient.get(ENDPOINTS.DASHBOARD_GANTT, {
            params: {
                startDate: dateStr,
                endDate: dateStr
            }
        });

        const data = response.data;
        const bookingsToday = data.bookings || [];
        const roomsData = data.rooms || [];
        const now = new Date();

        return bookingsToday
            .filter(b => {
                const status = b.status;
                return status === 'Chuẩn bị' || status === 'Chờ xác nhận';
            })
            .map(b => {
                const roomInfo = roomsData.find(r => String(r.id) === String(b.roomId)) || {};
                let currentStatus = b.status || 'Chuẩn bị';
                const expectedCheckIn = new Date(b.checkIn);

                if ((currentStatus === 'Chuẩn bị' || currentStatus === 'Chờ xác nhận') && expectedCheckIn < now) {
                    currentStatus = 'Quá hạn Check-in';
                }

                return {
                    id: String(b.datPhongId),
                    chiTietDatPhongId: String(b.id),
                    roomId: String(b.roomId),
                    soPhong: roomInfo.soPhong || 'N/A',
                    loai: roomInfo.loai || 'N/A',
                    guestName: b.customerName,
                    checkInTime: expectedCheckIn.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                    status: currentStatus,
                    cccd: b.customerCccd || ''
                };
            });
    } catch (error) {
        return [];
    }
};

export const submitCheckin = async (datPhongId, chiTietDatPhongId, guests) => {
    try {
        const payload = {
            danhSachPhong: [
                {
                    // Đảm bảo chiTietDatPhongId là giá trị chuỗi UUID hợp lệ
                    chiTietDatPhongId: chiTietDatPhongId,
                    khachLuuTrus: guests.map(g => ({
                        hoTen: g.fullName,
                        cccD_Passport: g.cccd,
                        quocTich: g.nationality || "Việt Nam"
                    }))
                }
            ]
        };

        // Gọi API với datPhongId (Mã đặt phòng tổng)
        const response = await apiClient.post(`/api/bookings/${datPhongId}/check-in`, payload);
        return response.data;
    } catch (error) {
        // Log chi tiết lỗi ra console để biết cụ thể lỗi gì từ phía Backend
        console.error("Chi tiết lỗi API:", error.response?.data || error);
        throw error;
    }
};


export const fetchInvoiceDetails = async (datPhongId) => {
    const response = await apiClient.get(`/api/bookings/${datPhongId}/invoice`);
    return response.data;
};

export const fetchBookingDetails = async (datPhongId) => {
    const response = await apiClient.get(`/api/profiles/bookings/${datPhongId}/details`);
    return response.data;
};

export const splitInvoice = async (datPhongId, chiTietDatPhongId, leTanId) => {
    const payload = { datPhongId, chiTietDatPhongId, leTanId };
    console.log("🚀 DỮ LIỆU GỬI LÊN TÁCH BILL:", payload);
    const response = await apiClient.post('/api/bookings/split-invoice', payload);
    return response.data;
};

export const confirmCheckout = async (datPhongId, phuongThucTT, leTanId) => {
    const response = await apiClient.post(`/api/bookings/${datPhongId}/confirm-checkout`, null, {
        params: {
            phuongThucTT: phuongThucTT,
            leTanId: leTanId
        }
    });
    return response.data;
};

export const fetchAllServices = async () => {
    try {
        const response = await apiClient.get('/api/services');
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy danh sách dịch vụ:", error);
        return [];
    }
};

// Thêm dịch vụ vào phòng
export const addServiceToRoom = async (payload) => {
    try {
        const response = await apiClient.post('/api/bookings/add-service', payload);
        return response.data;
    } catch (error) {
        console.error("Lỗi thêm dịch vụ:", error);
        throw error;
    }
};