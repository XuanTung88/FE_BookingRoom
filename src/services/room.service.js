import apiClient from './api.client';
import { ENDPOINTS } from '../config/api.config';

export const roomService = {
    getAll: () => apiClient.get(ENDPOINTS.ROOMS),
    create: (data) => apiClient.post(ENDPOINTS.ROOMS, data),
    update: (id, data) => apiClient.put(ENDPOINTS.ROOM_BY_ID(id), data),
    delete: (id) => apiClient.delete(ENDPOINTS.ROOM_BY_ID(id)),
};