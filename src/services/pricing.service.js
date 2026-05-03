import apiClient from './api.client';
import { ENDPOINTS } from '../config/api.config';

export const pricingService = {
    getAll: () => apiClient.get(ENDPOINTS.PRICING_POLICIES),
    create: (data) => apiClient.post(ENDPOINTS.PRICING_POLICIES, data),
    update: (id, data) => apiClient.put(ENDPOINTS.PRICING_BY_ID(id), data),
    delete: (id) => apiClient.delete(ENDPOINTS.PRICING_BY_ID(id)),
    toggle: (id) => apiClient.patch(ENDPOINTS.PRICING_TOGGLE(id)),

    getListPrice: (startDate, endDate, loaiPhongId) =>
        apiClient.get('/api/pricing-policies/list-price', {
            params: { startDate, endDate, loaiPhongId }
        }),
};