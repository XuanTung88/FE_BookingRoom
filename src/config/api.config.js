// src/config/api.config.js
import axios from 'axios';
export const API_BASE_URL = import.meta.env.VITE_API_URL
    ?? 'https://hotel-booking-production-e37d.up.railway.app';
// export const API_BASE_URL = import.meta.env.VITE_API_URL
//     ?? 'https://localhost:7291';


const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // Timeout sau 15s nếu server không phản hồi
});

// -------------------------------------------------------------
// 2. INTERCEPTORS (Can thiệp vào quá trình Gửi/Nhận Request)
// -------------------------------------------------------------

// REQUEST INTERCEPTOR: Tự động gắn JWT Token vào header trước khi gọi API
apiClient.interceptors.request.use(
    (config) => {
        // Lấy token từ LocalStorage (Giả sử bạn lưu với key là 'token')
        // Lưu ý: Đổi chữ 'token' thành tên key thực tế bạn đang lưu lúc Login nhé
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// RESPONSE INTERCEPTOR: Bắt lỗi chung từ Server trả về
apiClient.interceptors.response.use(
    (response) => {
        // Nếu API gọi thành công, trả về đúng phần data
        return response;
    },
    (error) => {
        if (error.response) {
            const status = error.response.status;

            // Lỗi 401: Hết hạn Token hoặc chưa đăng nhập
            if (status === 401) {
                console.error("Token đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
                localStorage.removeItem('token');

                // Bật dòng dưới đây nếu bạn muốn tự động đá user về trang Login
                // window.location.href = '/login'; 
            }

            // Lỗi 403: Không đủ quyền (Role) truy cập
            if (status === 403) {
                // Tắt log console nếu API là /api/rooms (vì đã biết Lễ Tân không có quyền)
                if (error.config && error.config.url && !error.config.url.includes('/api/rooms')) {
                    console.error("Bạn không có quyền thực hiện hành động này!");
                }
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;

export const ENDPOINTS = {
    // Auth
    AUTH_LOGIN: '/api/admin/Auth/login',
    AUTH_REGISTER: '/api/admin/Auth/register',

    // Rooms
    ROOMS: '/api/rooms',
    ROOM_BY_ID: (id) => `/api/rooms/${id}`,

    // Room types
    ROOM_TYPES: '/api/typeroom',
    ROOM_TYPE_BY_ID: (id) => `/api/typeroom/${id}`,

    // Services
    SERVICES: '/api/services',
    SERVICE_BY_ID: (id) => `/api/services/${id}`,

    // Equipment
    EQUIPMENTS: '/api/equipments',
    EQUIPMENT_BY_ID: (id) => `/api/equipments/${id}`,
    EQUIPMENT_ADD_QTY: (id) => `/api/equipments/${id}/add-quantity`,
    ROOM_ASSIGNMENTS: '/api/equipments/room-assignments',
    ROOM_ASSIGN_BY_ID: (id) => `/api/equipments/room-assignments/${id}`,

    // Pricing
    PRICING_POLICIES: '/api/pricing-policies',
    PRICING_BY_ID: (id) => `/api/pricing-policies/${id}`,
    PRICING_TOGGLE: (id) => `/api/pricing-policies/${id}/toggle`,
    PRICING_LIST_PRICE: '/api/pricing-policies/list-price',

    // Bookings
    BOOKINGS: '/api/bookings',
    AVAILABLE_ROOMS: '/api/bookings/available-rooms',
    BOOKING_CHECKIN: (id) => `/api/bookings/${id}/check-in`,
    BOOKING_INVOICE: (id) => `/api/bookings/${id}/invoice`,

    // Cập nhật tham số id thành datPhongId theo chuẩn Swagger
    BOOKING_CHECKOUT: (datPhongId) => `/api/bookings/${datPhongId}/confirm-checkout`,

    BOOKING_ADD_SVC: '/api/bookings/add-service',
    BOOKING_SPLIT: '/api/bookings/split-invoice',
    HOUSEKEEPING: '/api/bookings/housekeeping-inspection',

    // [SỬA]: Cập nhật tham số id thành phongId theo chuẩn Swagger 
    REQUEST_INSPECT: (phongId) => `/api/bookings/rooms/${phongId}/request-inspection`,

    // Admin
    ADMIN_USERS: '/api/admin/users',
    ADMIN_USER_CREATE: '/api/admin/users/create-account',
    ADMIN_USER_BY_ID: (id) => `/api/admin/users/${id}`,
    ADMIN_ASSIGN_ROLE: '/api/admin/users/assign-roles',
    ADMIN_USER_ROLES: (id) => `/api/admin/users/${id}/roles`, // [MỚI BỔ SUNG]
    ADMIN_ROLES: '/api/admin/roles',
    ADMIN_PERMISSIONS: '/api/admin/permissions',
    ADMIN_ASSIGN_PERM: '/api/admin/roles/assign-permissions',
    ADMIN_ROLE_PERMISSIONS: (id) => `/api/admin/roles/${id}/permissions`, // [MỚI BỔ SUNG]

    // Dashboard
    DASHBOARD_GANTT: '/api/Dashboard/gantt',

    // Profile
    PROFILES: '/api/profiles',

    // Bổ sung 3 API quản lý Profile và Booking Details theo Swagger
    PROFILE_CUSTOMER: (khachHangId) => `/api/profiles/customer/${khachHangId}`,
    PROFILE_CUSTOMER_BOOKINGS: (khachHangId) => `/api/profiles/customer/${khachHangId}/bookings`,
    PROFILE_BOOKING_DETAILS: (datPhongId) => `/api/profiles/bookings/${datPhongId}/details`,
};