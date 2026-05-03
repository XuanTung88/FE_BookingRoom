import apiClient from './api.client';
import { ENDPOINTS } from '../config/api.config';

export const bookingService = {
  getAvailableRooms: (startDate, endDate) =>
    apiClient.get(ENDPOINTS.AVAILABLE_ROOMS, { params: { startDate, endDate } }),

  create: (data) => apiClient.post(ENDPOINTS.BOOKINGS, data),

  checkIn: (id, data) => apiClient.post(ENDPOINTS.BOOKING_CHECKIN(id), data),

  checkOut: (id, params) =>
    apiClient.post(ENDPOINTS.BOOKING_CHECKOUT(id), null, { params }),

  getInvoice: (id) => apiClient.get(ENDPOINTS.BOOKING_INVOICE(id)),

  addService: (data) => apiClient.post(ENDPOINTS.BOOKING_ADD_SERVICE, data),

  splitBill: (data) => apiClient.post(ENDPOINTS.BOOKING_SPLIT, data),

  requestInspect: (phongId) =>
    apiClient.post(ENDPOINTS.REQUEST_INSPECT(phongId)),

  housekeepingInspect: (data) => apiClient.post(ENDPOINTS.HOUSEKEEPING, data),
};