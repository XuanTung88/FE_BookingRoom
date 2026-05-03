import apiClient from './api.client';
import { ENDPOINTS } from '../config/api.config';

export const equipmentService = {
    getAll: () => apiClient.get(ENDPOINTS.EQUIPMENTS),
    create: (data) => apiClient.post(ENDPOINTS.EQUIPMENTS, data),
    delete: (id) => apiClient.delete(ENDPOINTS.EQUIPMENT_BY_ID(id)),
    addQuantity: (id, amt) => apiClient.patch(ENDPOINTS.EQUIPMENT_ADD_QTY(id), null, { params: { amount: amt } }),
    getAssignments: () => apiClient.get(ENDPOINTS.ROOM_ASSIGNMENTS),
    assign: (data) => apiClient.post(ENDPOINTS.ROOM_ASSIGNMENTS, data),
    updateAssign: (id, data) => apiClient.put(ENDPOINTS.ROOM_ASSIGN_BY_ID(id), data),
    deleteAssign: (id) => apiClient.delete(ENDPOINTS.ROOM_ASSIGN_BY_ID(id)),
};