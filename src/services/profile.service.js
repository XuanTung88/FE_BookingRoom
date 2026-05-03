/**
 * profile.service.js
 *
 * Swagger endpoints Profile:
 *   POST   /api/profiles                              – Complete profile (limited token)
 *   GET    /api/profiles/customer/{khachHangId}       – Lấy thông tin khách hàng
 *   PUT    /api/profiles/customer/{khachHangId}       – Cập nhật thông tin (UpdateCustomerProfileVM)
 *   GET    /api/profiles/customer/{khachHangId}/bookings     – Danh sách đặt phòng
 *   GET    /api/profiles/bookings/{datPhongId}/details       – Chi tiết 1 đặt phòng
 *
 * KhachHangId = roleId trong JWT payload (payload['RoleId'])
 */
import apiClient from './api.client';
import { ENDPOINTS } from '../config/api.config';

export const profileService = {
  // ── Hoàn thiện profile lần đầu (limited token) ────────────────
  complete: (data) =>
    apiClient.post(ENDPOINTS.PROFILES, {
      soDienThoai  : data.soDienThoai   || null,
      ngaySinh     : data.ngaySinh      ? new Date(data.ngaySinh).toISOString() : null,
      gioiTinh     : data.gioiTinh      || null,
      queQuan      : data.queQuan       || null,
      cccD_Passport: data.cccdPassport  || null,
      quocTich     : data.quocTich      || null,
    }),

  // ── Lấy thông tin profile ────────────────────────────────────
  getCustomer: (khachHangId) =>
    apiClient.get(ENDPOINTS.PROFILE_CUSTOMER(khachHangId)),

  // ── Cập nhật profile (UpdateCustomerProfileVM) ───────────────
  // { hoTen, soDienThoai, cccdPassport, quocTich, ngaySinh, gioiTinh, queQuan }
  updateCustomer: (khachHangId, data) =>
    apiClient.put(ENDPOINTS.PROFILE_CUSTOMER(khachHangId), {
      hoTen        : data.hoTen        || null,
      soDienThoai  : data.soDienThoai  || null,
      cccdPassport : data.cccdPassport || null,
      quocTich     : data.quocTich     || null,
      ngaySinh     : data.ngaySinh     ? new Date(data.ngaySinh).toISOString() : null,
      gioiTinh     : data.gioiTinh     || null,
      queQuan      : data.queQuan      || null,
    }),

  // ── Lấy danh sách đặt phòng ──────────────────────────────────
  getBookings: (khachHangId) =>
    apiClient.get(ENDPOINTS.PROFILE_CUSTOMER_BOOKINGS(khachHangId)),

  // ── Lấy chi tiết 1 đặt phòng ─────────────────────────────────
  getBookingDetails: (datPhongId) =>
    apiClient.get(ENDPOINTS.PROFILE_BOOKING_DETAILS(datPhongId)),
};
