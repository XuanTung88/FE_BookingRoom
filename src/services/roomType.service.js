import apiClient from './api.client';
import { ENDPOINTS } from '../config/api.config';

export const roomTypeService = {
    getAll: () => apiClient.get(ENDPOINTS.ROOM_TYPES),
    create: (data) => apiClient.post(ENDPOINTS.ROOM_TYPES, data),
    update: (id, data) => apiClient.put(ENDPOINTS.ROOM_TYPE_BY_ID(id), data),
    delete: (id) => apiClient.delete(ENDPOINTS.ROOM_TYPE_BY_ID(id)),
};