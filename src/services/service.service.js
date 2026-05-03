import apiClient from './api.client';
import { ENDPOINTS } from '../config/api.config';

export const serviceService = {
    getAll: () => apiClient.get(ENDPOINTS.SERVICES),
    create: (data) => apiClient.post(ENDPOINTS.SERVICES, data),
    update: (id, data) => apiClient.put(ENDPOINTS.SERVICE_BY_ID(id), data),
    delete: (id) => apiClient.delete(ENDPOINTS.SERVICE_BY_ID(id)),
};