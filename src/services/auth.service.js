/**
 * auth.service.js
 * Xử lý đăng nhập / đăng ký.
 * 
 * ⚠️ KEY INSIGHT từ backend:
 * Controller Login chỉ trả { Token: "..." }.
 * RequireProfileUpdate KHÔNG có trong response body.
 * Frontend phải decode JWT → check claim Permission = "System.Onboarding"
 */
import apiClient from './api.client';
import { ENDPOINTS } from '../config/api.config';

export const authService = {
  /**
   * Đăng ký – 4 trường bắt buộc.
   * Backend: RegisterVM { TenDangNhap, HoTen, Email, Password }
   * => Tạo user với IsProfileCompleted = false
   */
  register: (tenDangNhap, hoTen, email, password) =>
    apiClient.post(ENDPOINTS.AUTH_REGISTER, { tenDangNhap, hoTen, email, password }),

  /**
   * Đăng nhập – trả { token }
   * Sau đó decode JWT để biết có cần complete profile không.
   * => isOnboarding() để check
   */
  login: (email, password) =>
    apiClient.post(ENDPOINTS.AUTH_LOGIN, { email, password }),

  /**
   * Kiểm tra xem JWT có phải limited onboarding token không.
   * Limited token chỉ có: Permission = "System.Onboarding"
   * Full token có: ClaimTypes.Role, Permission (nhiều)
   */
  isOnboardingToken: (decodedJWT) => {
    if (!decodedJWT) return false;
    const perm = decodedJWT['Permission'] ?? decodedJWT['permission'];
    if (Array.isArray(perm)) return perm.includes('System.Onboarding');
    return perm === 'System.Onboarding';
  },
};
