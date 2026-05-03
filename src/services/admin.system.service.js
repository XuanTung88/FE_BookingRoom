/**
 * admin.system.service.js
 *
 * Swagger endpoints AdminSystem:
 * GET    /api/admin/users
 * POST   /api/admin/users/create-account
 * DELETE /api/admin/users/{id}
 * GET    /api/admin/users/{id}/roles
 * POST   /api/admin/users/assign-roles
 * GET    /api/admin/roles
 * POST   /api/admin/roles
 * GET    /api/admin/roles/{id}/permissions
 * GET    /api/admin/permissions
 * POST   /api/admin/roles/assign-permissions
 */
import apiClient from './api.client';
import { ENDPOINTS } from '../config/api.config';

export const adminSystemService = {
  // ── Quản lý Người Dùng (Users) ────────────────────────────────────────────

  /**
   * Lấy danh sách người dùng có phân trang và tìm kiếm 
   * @param {Object} params - { keyword: string, pageIndex: number, pageSize: number }
   */
  getUsers: (params) => 
    apiClient.get(ENDPOINTS.ADMIN_USERS, { params }),

  /**
   * Tạo tài khoản quản trị / nhân sự mới 
   * @param {Object} data - AdminCreateUserVM: { tenDangNhap, hoTen, email, password, roleName }
   */
  createUser: (data) => 
    apiClient.post(ENDPOINTS.ADMIN_USER_CREATE, data),

  /**
   * Xóa một người dùng 
   * @param {string} id - UUID của người dùng
   */
  deleteUser: (id) => 
    apiClient.delete(ENDPOINTS.ADMIN_USER_BY_ID(id)),

  // ── Quản lý Vai trò của Người Dùng (User Roles) ──────────────────────────

  /**
   * Lấy danh sách các vai trò hiện tại của một người dùng 
   * @param {string} id - UUID của người dùng
   */
  getUserRoles: (id) => 
    apiClient.get(ENDPOINTS.ADMIN_USER_ROLES(id)),

  /**
   * Gán một hoặc nhiều vai trò cho người dùng 
   * @param {Object} data - AssignUserRoleVM: { nguoiDungId, vaiTroIds: string[] }
   */
  assignRoles: (data) => 
    apiClient.post(ENDPOINTS.ADMIN_ASSIGN_ROLE, data),

  // ── Quản lý Danh mục Vai trò (Roles) ─────────────────────────────────────

  /**
   * Lấy danh sách toàn bộ vai trò trong hệ thống 
   */
  getRoles: () => 
    apiClient.get(ENDPOINTS.ADMIN_ROLES),

  /**
   * Tạo một vai trò mới 
   * @param {Object} data - CreateRoleVM: { tenVaiTro }
   */
  createRole: (data) => 
    apiClient.post(ENDPOINTS.ADMIN_ROLES, data),

  // ── Quản lý Ma trận Phân quyền (Permissions) ─────────────────────────────

  /**
   * Lấy danh sách toàn bộ quyền (permissions) có trong hệ thống 
   */
  getPermissions: () => 
    apiClient.get(ENDPOINTS.ADMIN_PERMISSIONS),

  /**
   * Lấy danh sách các quyền đang được gán cho một vai trò cụ thể 
   * @param {string} id - UUID của vai trò (Role)
   */
  getRolePermissions: (id) => 
    apiClient.get(ENDPOINTS.ADMIN_ROLE_PERMISSIONS(id)),

  /**
   * Cập nhật danh sách quyền cho một vai trò 
   * @param {Object} data - AssignRolePermissionVM: { vaiTroId, quyenIds: string[] }
   */
  assignRolePermissions: (data) => 
    apiClient.post(ENDPOINTS.ADMIN_ASSIGN_PERM, data),
};

